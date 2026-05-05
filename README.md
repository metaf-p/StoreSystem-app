# StoreSystem

StoreSystem — это проект для управления складом с микросервисной архитектурой.

## Документация

- [Авторизация и сессия](/Users/metaf/Dev/git/StoreSystem-app/docs/authentication-session.md)
- [Технические требования: авторизация и JWT-сессия](/Users/metaf/Dev/git/StoreSystem-app/docs/authentication-requirements.md)
- [Техническая документация: авторизация и JWT-сессия](/Users/metaf/Dev/git/StoreSystem-app/docs/authentication-technical-docs.md)
- [Технические требования: ролевая модель](/Users/metaf/Dev/git/StoreSystem-app/docs/role-model-requirements.md)
- [Техническая документация: ролевая модель](/Users/metaf/Dev/git/StoreSystem-app/docs/role-model-technical-docs.md)
- [Production packaging and reverse proxy](/Users/metaf/Dev/git/StoreSystem-app/docs/production-packaging.md)

## Maintenance

- Preview cleanup of auth users except the seed admin:
  `make cleanup-users`
- Run the cleanup for real:
  `make cleanup-users-apply`
- Use a custom seed admin email if needed:
  `make cleanup-users SEED_EMAIL=admin@example.com`
