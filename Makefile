COMPOSE ?= docker compose
SEED_EMAIL ?=
AUTH_SERVICE_CLEANUP_SCRIPT ?= /app/scripts/cleanup_users_except_seed_admin.py

.PHONY: cleanup-users cleanup-users-apply

cleanup-users:
	$(COMPOSE) up -d db_auth
	$(COMPOSE) run --rm --build --no-deps auth_service python $(AUTH_SERVICE_CLEANUP_SCRIPT) $(if $(SEED_EMAIL),--seed-email $(SEED_EMAIL),) --dry-run

cleanup-users-apply:
	$(COMPOSE) up -d db_auth
	$(COMPOSE) run --rm --build --no-deps auth_service python $(AUTH_SERVICE_CLEANUP_SCRIPT) $(if $(SEED_EMAIL),--seed-email $(SEED_EMAIL),) --yes
