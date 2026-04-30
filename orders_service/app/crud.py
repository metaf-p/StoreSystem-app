# crud.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models import Order, OrderItem, OrderStatus
from app.schemas import OrderCreate
from uuid import UUID
from datetime import datetime
from app import logger


def create_order(db: Session, order_data: OrderCreate):
    try:
        # Создаем новый заказ
        new_order = Order(
            user_id=order_data.user_id,
            status=OrderStatus.pending,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(new_order)
        db.flush()  # Получаем order_id для использования в order_items
        # Добавляем позиции заказа
        for item_data in order_data.order_items:
            order_item = OrderItem(
                order_id=new_order.order_id,
                product_id=item_data.product_id,
                warehouse_id=item_data.warehouse_id,
                quantity=item_data.quantity,
                price_at_order=float(item_data.price_at_order)
            )
            db.add(order_item)
        db.commit()
        db.refresh(new_order)
        return new_order
    except SQLAlchemyError as e:
        db.rollback()
        logger.log_message(f"Erorr while creating order: {e}")
        raise


def get_order_by_id(db: Session, order_id: UUID):
    try:
        order = db.query(Order).filter(Order.order_id == order_id).first()
        return order
    except SQLAlchemyError as e:
        logger.log_message(f"Error while getting order by id: {e}")
        raise


def get_orders_by_user_id(db: Session, user_id: UUID):
    try:
        orders = db.query(Order).filter(Order.user_id == user_id).all()
        return orders
    except SQLAlchemyError as e:
        logger.log_message(
            f"Error while getting orders by user id: {e}")
        raise


def update_order_status(db: Session, order_id: UUID, new_status: OrderStatus):
    try:
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if not order:
            return None
        order.status = new_status
        order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(order)
        return order
    except SQLAlchemyError as e:
        db.rollback()
        logger.log_message(f"Error while updating order status: {e}")
        raise


def get_all_orders(db: Session):
    try:
        orders = db.query(Order).all()
        return orders
    except SQLAlchemyError as e:
        logger.log_message(f"Error while getting all orders: {e}")
        raise
