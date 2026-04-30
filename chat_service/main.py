# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from app import routes, database, logger
from app.websocket import router as websocket_router
from app.websocket import prefill_redis_with_history
# Запускаем Kafka Consumer в фоне
from app.kafka import start_kafka_consumer
import threading

app = FastAPI(
    title="Chat Microservice API",
    description="API for real-time chat system with WebSockets and Kafka notifications",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Настраиваем схему безопасности (JWT Bearer Token)
security = HTTPBearer()

# Подключаем CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Можно указать конкретные домены, если требуется
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    logger.log_message("Starting Chat Microservice...")
    database.init_db()
    start_kafka_consumer()  # Запускаем Kafka Consumer в фоновом режиме
    logger.log_message("Database initialized and Kafka Consumer started.")
    with database.SessionLocal() as db:
        prefill_redis_with_history(db)
    logger.log_message("Redis prefilled with last 50 messages for each chat.")


# Подключаем маршруты API
app.include_router(routes.router)

app.include_router(websocket_router)


# Настраиваем OpenAPI (Swagger) с JWT Bearer Token
@app.get("/openapi.json", include_in_schema=False)
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = app.openapi()
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            openapi_schema["paths"][path][method]["security"] = [
                {"bearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema
