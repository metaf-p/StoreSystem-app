"""Remove all auth users except the configured seed admin."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import crud, database, logger
from app.config import SEED_SUPERADMIN_EMAIL
from app.models import Token, User


def normalize_email(email: str) -> str:
    return email.strip().lower()


def get_seed_admin(db, seed_email: str):
    seed_user = crud.get_user_by_email(db, seed_email)
    if seed_user is None:
        raise RuntimeError(
            f"Seed admin {seed_email} was not found in the database."
        )
    return seed_user


def list_users_to_delete(db, seed_user):
    return (
        db.query(User)
        .filter(User.id != seed_user.id)
        .order_by(User.email.asc(), User.id.asc())
        .all()
    )


def purge_users_except_seed_admin(db, seed_user):
    users_to_delete = list_users_to_delete(db, seed_user)
    if seed_user.role != "admin":
        seed_user.role = "admin"
        seed_user.is_superadmin = True

    deleted_emails = []
    try:
        for user in users_to_delete:
            db.query(Token).filter(Token.user_id == str(user.id)).delete(
                synchronize_session=False
            )
            crud.drop_role_for_user(db, user.email)
            db.delete(user)
            deleted_emails.append(user.email)

        db.commit()
        db.refresh(seed_user)
    except Exception:
        db.rollback()
        raise

    logger.log_message(
        f"Purged {len(deleted_emails)} users and kept seed admin {seed_user.email}."
    )
    return deleted_emails


def build_parser():
    parser = argparse.ArgumentParser(
        description=(
            "Delete every auth_service user except the configured seed admin."
        )
    )
    parser.add_argument(
        "--seed-email",
        default=SEED_SUPERADMIN_EMAIL,
        help="Email of the user that must be preserved.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be deleted without changing the database.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Required to actually delete users.",
    )
    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    seed_email = normalize_email(args.seed_email)

    if not args.dry_run and not args.yes:
        print(
            "Refusing to modify the database without --yes.",
            file=sys.stderr,
        )
        return 2

    db = database.SessionLocal()
    try:
        try:
            seed_user = get_seed_admin(db, seed_email)
        except RuntimeError as exc:
            print(str(exc), file=sys.stderr)
            return 1

        if args.dry_run:
            users_to_delete = list_users_to_delete(db, seed_user)
            print(f"Seed admin kept: {seed_user.email}")
            print(f"Users that would be deleted: {len(users_to_delete)}")
            for user in users_to_delete:
                print(f"- {user.email} ({user.role})")
            return 0

        deleted_emails = purge_users_except_seed_admin(db, seed_user)
        print(f"Seed admin kept: {seed_user.email}")
        print(f"Deleted users: {len(deleted_emails)}")
        for email in deleted_emails:
            print(f"- {email}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
