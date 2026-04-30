# approval_queue.py
import redis
from app import logger

# Настройка подключения к Redis
redis_client = redis.Redis(host='redis', port=6379, db=0)


def add_product_to_pending(product_id: str):
    """
    Добавляет product_id в Redis для очереди на одобрение, если его там еще нет.
    """
    logger.log_message(f"""Attempting to add product ID {
                       product_id} to Redis pending queue.""")

    if not redis_client.sismember("pending_products", product_id):
        redis_client.sadd("pending_products", product_id)
        logger.log_message(
            f"Product ID {product_id} added to Redis pending queue for approval.")
    else:
        logger.log_message(
            f"Product ID {product_id} is already in the Redis pending queue.")


def get_pending_products():
    """
    Извлекает все product_id из очереди на одобрение в Redis.
    """
    product_ids = redis_client.smembers("pending_products")
    # Преобразование байтов в строки
    return [product_id.decode('utf-8') for product_id in product_ids]


def remove_product_from_pending(product_id: str):
    """
    Удаляет product_id из очереди на одобрение в Redis.
    """
    redis_client.srem("pending_products", product_id)
    logger.log_message(
        f"Product ID {product_id} removed from Redis pending queue.")
