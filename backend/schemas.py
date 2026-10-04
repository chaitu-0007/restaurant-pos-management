"""Pydantic request/response schemas."""
from typing import List, Optional

from pydantic import BaseModel, Field


# ---- Menu ----
class MenuItemIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(..., min_length=1, max_length=60)
    price: float = Field(..., ge=0)


class MenuItemOut(MenuItemIn):
    id: int


# ---- Orders ----
class OrderLineIn(BaseModel):
    menu_item_id: int
    qty: int = Field(..., ge=1)


class OrderCreate(BaseModel):
    items: List[OrderLineIn] = Field(..., min_length=1)


class OrderLineOut(BaseModel):
    menu_item_id: int
    name: str
    price: float
    qty: int


class OrderOut(BaseModel):
    id: int
    items: List[OrderLineOut]
    total: float
    status: str
    created_at: str


class StatusUpdate(BaseModel):
    # Optional explicit status; if omitted the order advances to the next stage.
    status: Optional[str] = None
