-- Создаем роль limited_user
CREATE ROLE limited_user;

-- Ограничиваем права для роли limited_user
GRANT CONNECT ON DATABASE strg_users_db TO limited_user;
GRANT USAGE ON SCHEMA public TO limited_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO limited_user;