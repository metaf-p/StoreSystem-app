# main.py
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app import routes, database, logger, crud, kafka, schemas
from sqlalchemy.orm import Session
from app.models import User
from app.database import get_session_local
from app.auth import verify_token
import threading
from app.kafka import create_topic_if_not_exists
import os

app = FastAPI(
    # Укажите название вашего микросервиса здесь
    title="User Manager Microservice API",
    # Описание вашего микросервиса
    description="API for managing users and roles in the application",
    version="1.0.0"  # Версия микросервиса
)

# Добавляем схему безопасности OAuth2 с токенами
security = HTTPBearer()

DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:8001,http://127.0.0.1:8001"
)


def _cors_origins():
    return [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
        if origin.strip()
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def start_kafka_consumer():
    # Запуск Kafka Consumer в отдельном потоке
    kafka_thread = threading.Thread(
        target=kafka.listen_for_product_approval_requests, daemon=True)
    kafka_thread.start()


FRONTEND_DIST_DIR = Path(
    os.getenv("FRONTEND_DIST_DIR")
    or Path(__file__).resolve().parent / "frontend_dist"
)
if not (FRONTEND_DIST_DIR / "index.html").exists():
    repo_frontend_dist = Path(__file__).resolve().parent.parent / "frontend" / "dist"
    if (repo_frontend_dist / "index.html").exists():
        FRONTEND_DIST_DIR = repo_frontend_dist

app.mount(
    "/app/assets",
    StaticFiles(directory=str(FRONTEND_DIST_DIR / "assets"), check_dir=False),
    name="app-assets",
)


def _spa_index():
    index_path = FRONTEND_DIST_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=503, detail="Frontend build not found")
    return FileResponse(index_path)


@app.on_event("startup")
def startup():
    database.init_db()
    create_topic_if_not_exists('product_topic')
    create_topic_if_not_exists('orders')
    create_topic_if_not_exists('order_responses')
    start_kafka_consumer()
    logger.log_message("Database initialized.")
    logger.log_message("Kafka consumer started.")


app.include_router(routes.router)


@app.get("/", include_in_schema=False)
def index():
    return RedirectResponse(url="/app/login", status_code=303)


@app.get("/products", include_in_schema=False)
def get_products_page():
    return RedirectResponse(url="/app/products", status_code=303)


@app.get("/suppliers", include_in_schema=False)
def get_suppliers_page():
    return RedirectResponse(url="/app/suppliers", status_code=303)


@app.get("/warehouses", include_in_schema=False)
def get_warehouses_page():
    return RedirectResponse(url="/app/warehouses", status_code=303)


@app.get("/pending-approval", include_in_schema=False)
def pending_approval_page():
    return RedirectResponse(url="/app/pending-approval", status_code=303)


@app.get("/user-list", include_in_schema=False)
def get_user_list():
    return RedirectResponse(url="/app/user-list", status_code=303)


@app.get("/orders", include_in_schema=False)
def get_orders_page():
    return RedirectResponse(url="/app/orders", status_code=303)


@app.get("/cart", include_in_schema=False)
def cart_page():
    return RedirectResponse(url="/app/cart", status_code=303)


@app.get("/shipments", include_in_schema=False)
def shipments_page():
    return RedirectResponse(url="/app/shipments", status_code=303)


@app.get("/warehouses_detail/{warehouse_id}", include_in_schema=False)
def warehouse_page(warehouse_id: str):
    return RedirectResponse(url=f"/app/warehouses/{warehouse_id}", status_code=303)


@app.get("/chat-ui", include_in_schema=False)
def chat_ui():
    return RedirectResponse(url="/app/chat", status_code=303)


@app.get("/admin_orders", include_in_schema=False)
def admin_orders_page():
    return RedirectResponse(url="/app/admin-orders", status_code=303)


@app.get("/app", include_in_schema=False)
@app.get("/app/", include_in_schema=False)
def spa_root():
    return _spa_index()


@app.get("/app/{path:path}", include_in_schema=False)
def spa_fallback(path: str):
    return _spa_index()


# Обновляем OpenAPI-схему для отображения Bearer токена в Swagger UI
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


def _get_current_user_from_access_token(token: str, db: Session):
    payload = verify_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user, user_id


def _user_response(user: User):
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@app.post(
    "/verify-token",
    response_model=schemas.TokenValidationResponseSchema,
    tags=["Auth"],
    summary="Verify access token",
)
async def verify_token_endpoint(
    body: schemas.TokenRequestSchema,
    db: Session = Depends(get_session_local),
):
    try:
        user, user_id = _get_current_user_from_access_token(body.token, db)
        logger.log_message(f"""Returning from verify_token_endpoint: valid=True, user_id={
                           user_id}, role={user.role}""")
        return {"valid": True, "user_id": user_id, "role": user.role}
    except HTTPException as e:
        return {"valid": False, "error": str(e.detail)}


@app.get(
    "/me",
    response_model=schemas.MeResponseSchema,
    tags=["Auth"],
    summary="Get current user",
)
async def me(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session_local)
):
    token = credentials.credentials
    user, _ = _get_current_user_from_access_token(token, db)

    return _user_response(user)
