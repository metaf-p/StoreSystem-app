from pathlib import Path
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "auth_service"))

from scripts import cleanup_users_except_seed_admin as cleanup


class _FakeUser:
    def __init__(self, user_id, email, role="customer", is_superadmin=False):
        self.id = user_id
        self.email = email
        self.role = role
        self.is_superadmin = is_superadmin


class _FakeQuery:
    def __init__(self, session, model):
        self.session = session
        self.model = model

    def filter(self, *args, **kwargs):
        return self

    def order_by(self, *args, **kwargs):
        return self

    def all(self):
        if self.model is cleanup.User:
            return [
                user
                for user in self.session.users
                if user.id != self.session.seed_user.id
            ]

        raise AssertionError("Unexpected all() call")

    def delete(self, synchronize_session=False):
        if self.model is cleanup.Token:
            self.session.deleted_token_rows += 1
            return 1

        raise AssertionError("Unexpected delete() call")


class _FakeSession:
    def __init__(self, seed_user, users):
        self.seed_user = seed_user
        self.users = users
        self.deleted_users = []
        self.deleted_token_rows = 0
        self.commit_count = 0
        self.rollback_count = 0
        self.refresh_count = 0
        self.closed = False

    def query(self, model):
        return _FakeQuery(self, model)

    def delete(self, instance):
        self.deleted_users.append(instance)

    def commit(self):
        self.commit_count += 1

    def rollback(self):
        self.rollback_count += 1

    def refresh(self, instance):
        self.refresh_count += 1

    def close(self):
        self.closed = True


class CleanupUsersExceptSeedAdminTest(unittest.TestCase):
    def test_list_users_to_delete_excludes_seed_admin(self):
        seed_user = _FakeUser("seed-id", "admin@example.com", role="admin")
        other_users = [
            _FakeUser("user-1", "alice@example.com"),
            _FakeUser("user-2", "bob@example.com"),
        ]
        session = _FakeSession(seed_user, [seed_user, *other_users])

        result = cleanup.list_users_to_delete(session, seed_user)

        self.assertEqual([user.email for user in result], ["alice@example.com", "bob@example.com"])

    def test_purge_users_except_seed_admin_deletes_every_other_user(self):
        seed_user = _FakeUser("seed-id", "admin@example.com", role="customer")
        other_users = [
            _FakeUser("user-1", "alice@example.com", role="customer"),
            _FakeUser("user-2", "bob@example.com", role="operator"),
        ]
        session = _FakeSession(seed_user, [seed_user, *other_users])

        with patch.object(cleanup.crud, "drop_role_for_user") as drop_role_for_user:
            deleted_emails = cleanup.purge_users_except_seed_admin(session, seed_user)

        self.assertEqual(set(deleted_emails), {"alice@example.com", "bob@example.com"})
        self.assertEqual(session.deleted_token_rows, 2)
        self.assertEqual(len(session.deleted_users), 2)
        self.assertEqual({user.email for user in session.deleted_users}, {"alice@example.com", "bob@example.com"})
        self.assertEqual(session.commit_count, 1)
        self.assertEqual(session.rollback_count, 0)
        self.assertEqual(session.refresh_count, 1)
        self.assertEqual(seed_user.role, "admin")
        self.assertTrue(seed_user.is_superadmin)
        self.assertEqual(
            [call.args[1] for call in drop_role_for_user.call_args_list],
            ["alice@example.com", "bob@example.com"],
        )

    def test_main_dry_run_does_not_mutate(self):
        seed_user = _FakeUser("seed-id", "admin@example.com", role="admin")
        session = _FakeSession(
            seed_user,
            [seed_user, _FakeUser("user-1", "alice@example.com")],
        )

        with patch.object(cleanup.database, "SessionLocal", return_value=session), \
                patch.object(cleanup.crud, "get_user_by_email", return_value=seed_user), \
                patch.object(cleanup, "purge_users_except_seed_admin") as purge_users:
            exit_code = cleanup.main(["--dry-run", "--seed-email", "admin@example.com"])

        self.assertEqual(exit_code, 0)
        purge_users.assert_not_called()
        self.assertEqual(session.commit_count, 0)
        self.assertEqual(session.deleted_users, [])
        self.assertEqual(session.deleted_token_rows, 0)
        self.assertTrue(session.closed)

    def test_main_refuses_mutation_without_yes(self):
        seed_user = _FakeUser("seed-id", "admin@example.com", role="admin")
        session = _FakeSession(seed_user, [seed_user])

        with patch.object(cleanup.database, "SessionLocal") as session_local, \
                patch.object(cleanup.crud, "get_user_by_email", return_value=seed_user), \
                patch.object(cleanup, "purge_users_except_seed_admin") as purge_users:
            exit_code = cleanup.main(["--seed-email", "admin@example.com"])

        self.assertEqual(exit_code, 2)
        session_local.assert_not_called()
        purge_users.assert_not_called()
        self.assertFalse(session.closed)


if __name__ == "__main__":
    unittest.main()
