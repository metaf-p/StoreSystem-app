# kafka.py
from kafka import KafkaProducer, KafkaConsumer
from kafka.admin import KafkaAdminClient, NewTopic
import json
import time
import threading
import app.logger as logger

KAFKA_BROKER = "kafka:9092"


# Создание топиков в кафка

def create_kafka_producer():
    """Создаёт Kafka Producer с повторными попытками подключения."""
    while True:
        try:
            producer = KafkaProducer(
                bootstrap_servers=[KAFKA_BROKER],
                value_serializer=lambda v: json.dumps(v).encode("utf-8")
            )
            logger.log_message("✅ Kafka Producer connected")
            return producer
        except Exception as e:
            logger.log_message(f"Error connecting to Kafka: {e}")
            time.sleep(5)


# Глобальный продюсер
producer = create_kafka_producer()


def create_topic_if_not_exists(topic_name: str):
    """
    Явно создаёт топик topic_name, если его ещё нет, 
    при условии, что брокер не создаёт топики автоматически.
    """
    try:
        admin_client = KafkaAdminClient(bootstrap_servers=[KAFKA_BROKER])
        existing_topics = admin_client.list_topics()
        if topic_name not in existing_topics:
            admin_client.create_topics([
                NewTopic(name=topic_name, num_partitions=1,
                         replication_factor=1)
            ])
            logger.log_message(f"Topic {topic_name} created.")
    except Exception as e:
        logger.log_message(f"Error creating topic {topic_name}: {e}")


def send_chat_notification(chat_id, sender_id, message_content):
    """
    Отправляет сообщение в Kafka-топик, уникальный для каждого чата:
    Топик: 'chat_{chat_id}'
    """
    event = {
        "chat_id": str(chat_id),
        "sender_id": str(sender_id),
        "message": message_content
    }
    topic_name = f"chat_{chat_id}"

    # Если авто-создание выключено, создаём топик.
    create_topic_if_not_exists(topic_name)

    try:
        producer.send(topic_name, value=event)
        producer.flush()
        logger.log_message(f"Sent message to topic {topic_name}: {event}")
    except Exception as e:
        logger.log_message(f"Error sending Kafka notification: {e}")


# Настройка консюмера Kafka
def consume_all_chat_topics():
    """
    Consumer, подписывающийся по шаблону 'chat_.*'
    и обрабатывающий события из всех чатов.
    """
    while True:
        try:
            consumer = KafkaConsumer(
                bootstrap_servers=[KAFKA_BROKER],
                auto_offset_reset="earliest",
                enable_auto_commit=True,
                group_id="chat_service_group",
                value_deserializer=lambda v: json.loads(v.decode("utf-8"))
            )
            consumer.subscribe(pattern="^chat_.*$")
            logger.log_message(
                "✅ Kafka Consumer connected for pattern chat_.*")

            for message in consumer:
                event = message.value
                chat_id = event["chat_id"]
                sender_id = event["sender_id"]
                content = event["message"]
                logger.log_message(
                    f"Received message in chat {chat_id} from user {sender_id}: {content}"
                )
                # Здесь можно прокинуть в Redis, WebSocket и т.д.

        except Exception as e:
            logger.log_message(f"Error connecting or consuming Kafka: {e}")
            time.sleep(5)

# Функция для старта Kafka Consumer в отдельном потоке


def start_kafka_consumer():
    """
    Запускает consumer в отдельном потоке, который слушает все чаты.
    """
    consumer_thread = threading.Thread(
        target=consume_all_chat_topics,
        daemon=True
    )
    consumer_thread.start()
