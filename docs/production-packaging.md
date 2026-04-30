# Deployment And Reverse Proxy

Use the single root compose file for both local QA and production-like runs.

## Build And Start

```bash
docker compose up --build
```

This starts:

- the backend services
- the static React frontend container
- the reverse proxy on `80` and `443`
- the backend host ports used by API tests

## Browser Tests

Point Playwright at the proxy origin:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1 npx playwright test
```

For HTTPS deployment use the public origin, for example `https://store.example.com`.

## Public Routes

- `/app/` and `/app/*` serve the React SPA from `frontend`.
- `/api/auth/*` proxies to `auth_service`.
- `/api/products/*` proxies to `products_service`.
- `/api/orders/*` proxies to `orders_service`.
- `/api/chat/*` proxies to `chat_service`.
- `/ws/*` proxies to the chat websocket endpoint.
- Legacy page routes redirect to the React equivalents:
  - `/products` → `/app/products`
  - `/suppliers` → `/app/suppliers`
  - `/warehouses` → `/app/warehouses`
  - `/warehouses_detail/{id}` → `/app/warehouses/{id}`
  - `/orders` → `/app/orders`
  - `/cart` → `/app/cart`
  - `/shipments` → `/app/shipments`
  - `/pending-approval` → `/app/pending-approval`
  - `/user-list` → `/app/user-list`
  - `/admin_orders` → `/app/admin-orders`
  - `/chat-ui` → `/app/chat`
  - `/login` → `/app/login`
  - `/register` → `/app/register`

## QA / API Testing

The main compose publishes the service ports directly, so you can hit the APIs from the host without any extra overlay:

- `http://127.0.0.1:8001` for `auth_service`
- `http://127.0.0.1:8002` for `products_service`
- `http://127.0.0.1:8003` for `orders_service`
- `http://127.0.0.1:8004` for `chat_service`

The same compose also publishes Redis, Kafka, Kafka UI, and PostgreSQL on their standard local ports for lower-level testing.

## Required Frontend Env

The static frontend build uses same-origin API paths:

- `VITE_AUTH_API_URL=/api/auth`
- `VITE_PRODUCTS_API_URL=/api/products`
- `VITE_ORDERS_API_URL=/api/orders`
- `VITE_CHAT_API_URL=/api/chat`
- `VITE_CHAT_WS_URL=/ws` or omit it and derive the websocket base from the current origin

## Notes

- The reverse proxy listens on `80` and `443`.
- If no certificate files are mounted at `/etc/nginx/certs/server.crt` and `/etc/nginx/certs/server.key`, the proxy generates a self-signed cert on startup for local smoke. Mount real certificates for a production HTTPS deployment.
- WebSocket upgrades are forwarded to `chat_service` with `Upgrade` and `Connection` headers preserved.
- Cookies are same-origin through the proxy; `auth_service` marks the refresh cookie as `Secure` when `X-Forwarded-Proto: https` is present.
