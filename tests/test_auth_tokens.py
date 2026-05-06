from pathlib import Path
import os
import sys
import threading
import uuid
import unittest
from datetime import datetime, timedelta

from sqlalchemy import create_engine, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException
from jose import jwt

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "auth_service"))

from app import auth, database
from app.models import Token


class _GuardedSession:
    def __init__(self):
        self.executed_statement = None
        self.commit_count = 0

    def query(self, *args, **kwargs):
        raise AssertionError("create_tokens should not query existing token rows")

    def add(self, *args, **kwargs):
        raise AssertionError("create_tokens should not add ORM token rows")

    def execute(self, statement):
        self.executed_statement = statement

    def commit(self):
        self.commit_count += 1


class _ExecuteBarrierSession:
    def __init__(self, session, barrier):
        self._session = session
        self._barrier = barrier
        self._execute_calls = 0

    def execute(self, statement):
        self._execute_calls += 1
        if self._execute_calls == 1:
            self._barrier.wait(timeout=10)
        return self._session.execute(statement)

    def __getattr__(self, item):
        return getattr(self._session, item)


class CreateTokensUnitTest(unittest.TestCase):
    def test_create_tokens_inserts_independent_refresh_session(self):
        session = _GuardedSession()

        tokens = auth.create_tokens(
            {"sub": "unit-test-user"},
            session,
        )

        self.assertEqual(session.commit_count, 1)
        self.assertIsNotNone(session.executed_statement)
        sql = str(
            session.executed_statement.compile(
                dialect=postgresql.dialect(),
            )
        ).upper()
        self.assertIn("INSERT INTO", sql)
        self.assertNotIn("ON CONFLICT", sql)
        self.assertTrue(tokens["access_token"])
        self.assertTrue(tokens["refresh_token"])


class VerifyTokenUnitTest(unittest.TestCase):
    def test_verify_token_decodes_access_token_without_db_lookup(self):
        token = jwt.encode(
            {
                "sub": "unit-test-user",
                "token_type": "access",
                "exp": datetime.utcnow() + timedelta(minutes=5),
            },
            auth.SECRET_KEY,
            algorithm=auth.ALGORITHM,
        )

        session = _GuardedSession()
        payload = auth.verify_token(token, session)

        self.assertEqual(payload["sub"], "unit-test-user")
        self.assertEqual(payload["token_type"], "access")

    def test_verify_token_rejects_refresh_token(self):
        token = jwt.encode(
            {
                "sub": "unit-test-user",
                "token_type": "refresh",
                "exp": datetime.utcnow() + timedelta(minutes=5),
            },
            auth.SECRET_KEY,
            algorithm=auth.ALGORITHM,
        )

        with self.assertRaises(HTTPException) as context:
            auth.verify_token(token, _GuardedSession())

        self.assertEqual(context.exception.status_code, 401)


class CreateTokensConcurrencyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.database_url = os.environ.get(
            "AUTH_TEST_DATABASE_URL",
            "postgresql://storage_admin:THw7l0bxvPPkWUhP@localhost:5435/strg_users_db"
        )
        cls.engine = create_engine(cls.database_url, pool_pre_ping=True)
        try:
            with cls.engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except Exception as exc:
            raise unittest.SkipTest(f"auth postgres is unavailable: {exc}")

        database.migrate_refresh_sessions()
        Token.__table__.create(bind=cls.engine, checkfirst=True)
        cls.session_factory = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)

    def setUp(self):
        self.user_id = str(uuid.uuid4())
        self._cleanup_tokens()

    def tearDown(self):
        self._cleanup_tokens()

    def _cleanup_tokens(self):
        session = self.session_factory()
        try:
            session.query(Token).filter(Token.user_id == self.user_id).delete()
            session.commit()
        finally:
            session.close()

    def test_concurrent_create_tokens_does_not_raise(self):
        barrier = threading.Barrier(2)
        results = []
        errors = []
        results_lock = threading.Lock()

        def worker():
            session = self.session_factory()
            wrapped_session = _ExecuteBarrierSession(session, barrier)
            try:
                tokens = auth.create_tokens(
                    {"sub": self.user_id},
                    wrapped_session,
                )
                with results_lock:
                    results.append(tokens)
            except Exception as exc:
                with results_lock:
                    errors.append(exc)
            finally:
                session.close()

        threads = [threading.Thread(target=worker) for _ in range(2)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=20)

        for thread in threads:
            self.assertFalse(thread.is_alive(), "worker thread did not finish")

        self.assertEqual(errors, [], f"unexpected token persistence errors: {errors!r}")
        self.assertEqual(len(results), 2)

        session = self.session_factory()
        try:
            rows = session.query(Token).filter(Token.user_id == self.user_id).all()
            returned_access_tokens = {result["access_token"] for result in results}
            returned_refresh_tokens = {result["refresh_token"] for result in results}
            self.assertEqual(len(rows), 2)
            self.assertEqual({row.access_token for row in rows}, returned_access_tokens)
            self.assertEqual({row.refresh_token for row in rows}, returned_refresh_tokens)
        finally:
            session.close()


if __name__ == "__main__":
    unittest.main()
