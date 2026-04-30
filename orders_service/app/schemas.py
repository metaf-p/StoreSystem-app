# schemas.py

from pydantic import BaseModel, conint, condecimal
from typing import List
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from enum import Enum


class OrderStatusEnum(str, Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"


class OrderItemCreate(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    quantity: conint(gt=0)
    price_at_order: condecimal(gt=0, max_digits=10, decimal_places=2)


class OrderCreate(BaseModel):
    user_id: UUID
    order_items: List[OrderItemCreate]


class OrderItemResponse(BaseModel):
    order_item_id: UUID
    order_id: UUID
    product_id: UUID
    warehouse_id: UUID
    quantity: int
    price_at_order: Decimal

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    order_id: UUID
    user_id: UUID
    status: OrderStatusEnum
    created_at: datetime
    updated_at: datetime
    order_items: List[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdateSchema(BaseModel):
    status: OrderStatusEnum
