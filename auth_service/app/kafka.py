import json
from kafka import KafkaConsumer
from app import logger  # Логгер для вывода информации
# Импорт функции для добавления продукта
from app.approval_queue import add_product_to_pending
from kafka.admin import KafkaAdminClient, NewTopic

# Конфигурация Kafka консюмера
consumer = KafkaConsumer(
    'product_topic',  # Название топика
    bootstrap_servers=['kafka:9092'],
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)


def listen_for_product_approval_requests():
    """
    Обрабатывает входящие заявки из топика Kafka и добавляет их в очередь одобрения.
    """
    logger.log_message("Starting to listen for product approval requests...")
    for message in consumer:
        logger.log_message(f"New message received from Kafka topic: {message}")
        product_id = message.value.get('product_id')
        logger.log_message(f"Product ID got from kafka: {product_id}")
        if product_id:
            add_product_to_pending(product_id)  # Добавляем продукт в очередь
            logger.log_message(
                f"Received product approval request for ID: {product_id}")
        else:
            logger.log_message("Received message without product ID.")


def create_topic_if_not_exists(topic_name):
    """
    Создает топик в Kafka, если он еще не существует.
    """
    try:
        admin_client = KafkaAdminClient(bootstrap_servers='kafka:9092')

        # Проверяем, существует ли топик
        existing_topics = admin_client.list_topics()
        if topic_name not in existing_topics:
            # Создаем топик с нужными параметрами
            topic_config = {
                "retention.ms": "5000",  # Сообщения хранятся
                # Удалять записи, если размер топика превышает 1 ГБ
                "retention.bytes": "1073741824",
            }
            new_topic = NewTopic(
                name=topic_name,
                num_partitions=1,
                replication_factor=1,
                topic_configs=topic_config
            )
            admin_client.create_topics([new_topic])
            print(f"Topic '{topic_name}' created.")
        else:
            print(f"Topic '{topic_name}' already exists.")
    except Exception as e:
        print(f"Error creating Kafka topic: {str(e)}")
        raise
