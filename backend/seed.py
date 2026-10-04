"""Demo data + auto-seeding logic.

This file is COMMITTED to the repo so demo data always ships, even though the
generated pos.db file is gitignored. `seed_if_empty()` runs on app startup and
is idempotent: it only inserts data when the tables are empty, so re-running the
app never duplicates rows.
"""
import json
import random
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
from models import MenuItem, Order

# ~20 menu items across 5 categories.
MENU_ITEMS = [
    # Starters
    ("Garlic Bread", "Starters", 5.50),
    ("Mozzarella Sticks", "Starters", 7.00),
    ("Soup of the Day", "Starters", 6.25),
    ("Bruschetta", "Starters", 6.75),
    # Mains
    ("Margherita Pizza", "Mains", 12.50),
    ("Pepperoni Pizza", "Mains", 14.00),
    ("Spaghetti Bolognese", "Mains", 13.25),
    ("Grilled Salmon", "Mains", 18.50),
    ("Classic Cheeseburger", "Mains", 11.75),
    ("Caesar Salad", "Mains", 9.50),
    ("Chicken Alfredo", "Mains", 15.00),
    ("Veggie Stir Fry", "Mains", 12.00),
    # Sides
    ("French Fries", "Sides", 4.00),
    ("Onion Rings", "Sides", 4.50),
    ("Side Salad", "Sides", 3.75),
    # Desserts
    ("Chocolate Lava Cake", "Desserts", 6.50),
    ("Cheesecake", "Desserts", 6.00),
    ("Ice Cream Sundae", "Desserts", 5.25),
    # Drinks
    ("Soft Drink", "Drinks", 2.50),
    ("Fresh Lemonade", "Drinks", 3.50),
    ("Coffee", "Drinks", 2.75),
    ("Bottled Water", "Drinks", 1.95),
]


def _build_order(items_pool, statuses, when):
    """Create one Order row from a random selection of menu items."""
    chosen = random.sample(items_pool, k=random.randint(1, 4))
    lines = []
    total = 0.0
    for item in chosen:
        qty = random.randint(1, 3)
        total += item.price * qty
        lines.append(
            {
                "menu_item_id": item.id,
                "name": item.name,
                "price": item.price,
                "qty": qty,
            }
        )
    return Order(
        items_json=json.dumps(lines),
        total=round(total, 2),
        status=random.choice(statuses),
        created_at=when,
    )


def seed_if_empty():
    """Create tables (if needed) and load demo data when tables are empty."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(MenuItem).count() > 0:
            return  # Already seeded — stay idempotent.

        # --- Menu items ---
        items = [
            MenuItem(name=n, category=c, price=p) for (n, c, p) in MENU_ITEMS
        ]
        db.add_all(items)
        db.commit()
        for it in items:
            db.refresh(it)

        # --- Orders (~15) spread across today so the dashboard has data ---
        random.seed(42)  # deterministic demo data
        now = datetime.now()
        today_start = now.replace(hour=9, minute=0, second=0, microsecond=0)

        orders = []
        # A dozen orders already completed/paid earlier today (drives revenue).
        for i in range(9):
            when = today_start + timedelta(minutes=random.randint(0, 480))
            orders.append(_build_order(items, ["paid", "served"], when))
        # A few currently active orders for the kitchen view.
        for i in range(6):
            when = now - timedelta(minutes=random.randint(1, 40))
            orders.append(_build_order(items, ["placed", "preparing"], when))

        db.add_all(orders)
        db.commit()
        print(f"[seed] Inserted {len(items)} menu items and {len(orders)} orders.")
    finally:
        db.close()


if __name__ == "__main__":
    # Allow manual seeding: `python seed.py`
    seed_if_empty()
    print("[seed] Done.")
