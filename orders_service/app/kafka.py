# kafka.py

import json
from kafka import KafkaProducer, KafkaConsumer
from threading import Thread
from app import logger
from app.database import SessionLocal
from app.models import Order, OrderStatus
from datetime import datetime
from sqlalchemy.orm import Session
from app.config import KAFKA_BOOTSTRAP_SERVERS
from uuid import UUID

# Настройка Kafka продюсера
producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# Настройка Kafka консюмера
consumer = KafkaConsumer(
    'order_responses',
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    group_id='order_service_group',
    auto_offset_reset='earliest',
    enable_auto_commit=True
)


def send_to_kafka(topic: str, message: dict):
    try:
        producer.send(topic, message)
        producer.flush()
        logger.log_message(f"""Message sent to Kafka: {
                           message} to topic: {topic}""")
    except Exception as e:
        logger.log_message(f"Error sending message to Kafka: {e}")


def consume_messages():
    try:
        for message in consumer:
            process_message(message.value)
    except Exception as e:
        logger.log_message(f"Error consuming messages from Kafka: {e}")


def process_message(message: dict):
    event_type = message.get('event_type')
    order_id = message.get('order_id')
    db: Session = SessionLocal()
    try:
        if event_type == 'OrderConfirmed':
            # Обработка подтверждения заказа
            order = db.query(Order).filter(
                Order.order_id == UUID(order_id)).first()
            if order:
                order.status = OrderStatus.completed
                order.updated_at = datetime.utcnow()
                db.commit()
                logger.log_message(
                    f"Status of order {order_id} updated to 'completed'")
            else:
                logger.log_message(
                    f"Order {order_id} not found in the database.")
        elif event_type == 'OrderRejected':
            # Обработка отклонения заказа
            reason = message.get('reason')
            order = db.query(Order).filter(
                Order.order_id == UUID(order_id)).first()
            if order:
                order.status = OrderStatus.cancelled
                order.updated_at = datetime.utcnow()
                db.commit()
                logger.log_message(
                    f"Order {order_id} rejected. Reason: {reason}")
            else:
                logger.log_message(
                    f"Order {order_id} not found in the database.")
        else:
            logger.log_message(
                f"Got unknown event type: {event_type}. Message: {message}")
    except Exception as e:
        logger.log_message(f"Error processing message from Kafka: {e}")
        db.rollback()
    finally:
        db.close()


def start_consumer():
    thread = Thread(target=consume_messages)
    thread.daemon = True
    thread.start()
