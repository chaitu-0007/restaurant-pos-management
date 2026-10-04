"""Restaurant POS & Order Management — FastAPI backend.

Serves a JSON API under /api/* AND the built React app (single port, no CORS).
Run with:  uvicorn main:app --reload   (from the backend/ folder)
"""
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from database import get_db
from models import MenuItem, Order, ORDER_STATUSES
from schemas import (
    MenuItemIn,
    MenuItemOut,
    OrderCreate,
    OrderOut,
    StatusUpdate,
)
from seed import seed_if_empty

app = FastAPI(title="Restaurant POS & Order Management")

# Path to the built React app (frontend/dist), resolved relative to this file.
FRONTEND_DIST = (Path(__file__).resolve().parent.parent / "frontend" / "dist")


@app.on_event("startup")
def on_startup():
    # Create tables and auto-load demo data on first run (idempotent).
    seed_if_empty()


# =====================================================================
#  Menu CRUD
# =====================================================================
@app.get("/api/menu", response_model=list[MenuItemOut])
def list_menu(db: Session = Depends(get_db)):
    items = db.query(MenuItem).order_by(MenuItem.category, MenuItem.name).all()
    return [i.to_dict() for i in items]


@app.post("/api/menu", response_model=MenuItemOut, status_code=201)
def create_menu_item(payload: MenuItemIn, db: Session = Depends(get_db)):
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@app.put("/api/menu/{item_id}", response_model=MenuItemOut)
def update_menu_item(
    item_id: int, payload: MenuItemIn, db: Session = Depends(get_db)
):
    item = db.get(MenuItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for field, value in payload.model_dump().items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item.to_dict()


@app.delete("/api/menu/{item_id}", status_code=204)
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.get(MenuItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(item)
    db.commit()
    return None


# =====================================================================
#  Orders
# =====================================================================
@app.get("/api/orders", response_model=list[OrderOut])
def list_orders(active: bool = False, db: Session = Depends(get_db)):
    """List orders, newest first. ?active=true returns only placed/preparing."""
    query = db.query(Order)
    if active:
        query = query.filter(Order.status.in_(["placed", "preparing"]))
    orders = query.order_by(Order.created_at.desc()).all()
    return [o.to_dict() for o in orders]


@app.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order.to_dict()


@app.post("/api/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    lines = []
    total = 0.0
    for line in payload.items:
        item = db.get(MenuItem, line.menu_item_id)
        if not item:
            raise HTTPException(
                status_code=400,
                detail=f"Menu item {line.menu_item_id} does not exist",
            )
        total += item.price * line.qty
        lines.append(
            {
                "menu_item_id": item.id,
                "name": item.name,
                "price": item.price,
                "qty": line.qty,
            }
        )

    order = Order(
        items_json=json.dumps(lines),
        total=round(total, 2),
        status="placed",
        created_at=datetime.now(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order.to_dict()


@app.patch("/api/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int, payload: StatusUpdate, db: Session = Depends(get_db)
):
    """Advance an order to the next stage, or set an explicit valid status."""
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payload.status is not None:
        if payload.status not in ORDER_STATUSES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of {ORDER_STATUSES}",
            )
        order.status = payload.status
    else:
        # Advance to the next status in the lifecycle.
        idx = ORDER_STATUSES.index(order.status)
        if idx < len(ORDER_STATUSES) - 1:
            order.status = ORDER_STATUSES[idx + 1]

    db.commit()
    db.refresh(order)
    return order.to_dict()


# =====================================================================
#  Daily sales summary
# =====================================================================
@app.get("/api/summary/daily")
def daily_summary(db: Session = Depends(get_db)):
    """Revenue, order count, and top items for orders created today."""
    today = datetime.now().date()
    orders = db.query(Order).all()

    todays = [o for o in orders if o.created_at.date() == today]
    paid = [o for o in todays if o.status == "paid"]

    revenue = round(sum(o.total for o in paid), 2)

    # Top items by quantity sold today (across all of today's orders).
    item_qty = defaultdict(int)
    item_revenue = defaultdict(float)
    for o in todays:
        for line in json.loads(o.items_json):
            item_qty[line["name"]] += line["qty"]
            item_revenue[line["name"]] += line["price"] * line["qty"]

    top_items = sorted(
        (
            {"name": name, "qty": qty, "revenue": round(item_revenue[name], 2)}
            for name, qty in item_qty.items()
        ),
        key=lambda x: x["qty"],
        reverse=True,
    )[:5]

    # Count of orders in each status today (for the dashboard breakdown).
    status_counts = {s: 0 for s in ORDER_STATUSES}
    for o in todays:
        status_counts[o.status] = status_counts.get(o.status, 0) + 1

    return {
        "date": today.isoformat(),
        "revenue": revenue,
        "paid_orders": len(paid),
        "total_orders": len(todays),
        "top_items": top_items,
        "status_counts": status_counts,
    }


# =====================================================================
#  Serve the built React app (single port, SPA fallback)
#  NOTE: keep this mount LAST so it never shadows the /api routes above.
# =====================================================================
if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    def serve_spa(full_path: str):
        # Serve real files when they exist (e.g. favicon, vite.svg)...
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        # ...otherwise fall back to index.html so React Router works.
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
        raise HTTPException(status_code=404, detail="Frontend not built")
