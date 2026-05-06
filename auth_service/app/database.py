# database.py
from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import sessionmaker

from app.config import (
    SEED_SUPERADMIN_EMAIL,
    SEED_SUPERADMIN_ENABLED,
    SEED_SUPERADMIN_NAME,
    SEED_SUPERADMIN_PASSWORD,
    SQLALCHEMY_DATABASE_URI,
)
from app import crud, logger, models, schemas

DATABASE_URL = SQLALCHEMY_DATABASE_URI

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    # Регистрируем таблицы из единого metadata объекта моделей.
    models.Base.metadata.create_all(bind=engine)
    migrate_user_roles()
    migrate_refresh_sessions()
    seed_superadmin()


def migrate_user_roles():
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    with engine.begin() as connection:
        if "role" not in columns:
            connection.execute(text(
                "ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'customer'"
            ))
        if "is_superadmin" in columns:
            connection.execute(text(
                "UPDATE users SET role = CASE WHEN is_superadmin THEN 'admin' ELSE 'customer' END "
                "WHERE role IS NULL OR role = 'customer'"
            ))
        connection.execute(text(
            "UPDATE users SET role = 'customer' WHERE role NOT IN ('customer', 'operator', 'admin')"
        ))


def migrate_refresh_sessions():
    inspector = inspect(engine)
    if "tokens" not in inspector.get_table_names():
        return

    pk_constraint = inspector.get_pk_constraint("tokens") or {}
    pk_columns = pk_constraint.get("constrained_columns") or []
    if pk_columns == ["refresh_token"]:
        with engine.begin() as connection:
            connection.execute(text(
                "CREATE INDEX IF NOT EXISTS ix_tokens_user_id ON tokens (user_id)"
            ))
        return

    if pk_columns != ["user_id"]:
        return

    pk_name = pk_constraint.get("name") or "tokens_pkey"
    with engine.begin() as connection:
        connection.execute(text(f'ALTER TABLE tokens DROP CONSTRAINT "{pk_name}"'))
        connection.execute(text("ALTER TABLE tokens ADD PRIMARY KEY (refresh_token)"))
        connection.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_tokens_user_id ON tokens (user_id)"
        ))

    logger.log_message("Migrated tokens table to allow multiple refresh sessions per user.")


def seed_superadmin():
    if not SEED_SUPERADMIN_ENABLED:
        logger.log_message("Seed superadmin is disabled.")
        return None

    db = SessionLocal()
    try:
        email = SEED_SUPERADMIN_EMAIL.strip().lower()
        existing_user = crud.get_user_by_email(db, email)
        if existing_user:
            if existing_user.role != "admin":
                existing_user.role = "admin"
                existing_user.is_superadmin = True
                db.commit()
                db.refresh(existing_user)
                logger.log_message(
                    f"Existing seed user {email} promoted to admin."
                )
            return existing_user

        seed_user = schemas.UserCreate(
            name=SEED_SUPERADMIN_NAME,
            email=email,
            password=SEED_SUPERADMIN_PASSWORD,
        )
        created_user = crud.create_user(
            db=db,
            user=seed_user,
            role="admin",
        )
        logger.log_message(f"Seed admin {email} has been created.")
        return created_user
    except Exception as exc:
        logger.log_message(f"Seed superadmin failed: {exc}")
        raise
    finally:
        db.close()


def get_session_local():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
