from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "auth_service"))

from app import database


class _FakeInspector:
    def __init__(self, table_names, columns):
        self.table_names = table_names
        self.columns = columns

    def get_table_names(self):
        return self.table_names

    def get_columns(self, table_name):
        if table_name != "users":
            raise AssertionError(f"Unexpected table lookup: {table_name}")
        return [{"name": column} for column in self.columns]


class _FakeConnection:
    def __init__(self):
        self.executed = []

    def execute(self, statement):
        self.executed.append(getattr(statement, "text", str(statement)))


class _FakeBeginContext:
    def __init__(self, connection):
        self.connection = connection

    def __enter__(self):
        return self.connection

    def __exit__(self, exc_type, exc, traceback):
        return False


class _FakeEngine:
    def __init__(self):
        self.connection = _FakeConnection()

    def begin(self):
        return _FakeBeginContext(self.connection)


class MigrateUserRolesTest(unittest.TestCase):
    def test_migrate_user_roles_adds_role_backfills_and_drops_legacy_column(self):
        engine = _FakeEngine()
        inspector = _FakeInspector(
            table_names=["users"],
            columns=["id", "email", "is_superadmin"],
        )

        with patch.object(database, "engine", engine), \
                patch.object(database, "inspect", return_value=inspector):
            database.migrate_user_roles()

        self.assertEqual(
            engine.connection.executed,
            [
                "ALTER TABLE users ADD COLUMN role VARCHAR NOT NULL DEFAULT 'customer'",
                "UPDATE users SET role = CASE WHEN is_superadmin THEN 'admin' ELSE 'customer' END WHERE role IS NULL OR role = 'customer'",
                "ALTER TABLE users DROP COLUMN IF EXISTS is_superadmin",
                "UPDATE users SET role = 'customer' WHERE role NOT IN ('customer', 'operator', 'admin')",
            ],
        )


if __name__ == "__main__":
    unittest.main()
