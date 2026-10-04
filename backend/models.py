"""SQLAlchemy ORM models for the Restaurant POS app."""
from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

# Order lifecycle: placed -> preparing -> served -> paid
ORDER_STATUSES = ["placed", "preparing", "served", "paid"]


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(60), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "price": self.price,
        }


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # items_json is a JSON string: [{"menu_item_id", "name", "price", "qty"}, ...]
    items_json: Mapped[str] = mapped_column(Text, nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="placed")
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )

    def to_dict(self):
        import json

        return {
            "id": self.id,
            "items": json.loads(self.items_json),
            "total": self.total,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
