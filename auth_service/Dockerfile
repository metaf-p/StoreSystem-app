# syntax=docker/dockerfile:1

FROM node:20-alpine AS frontend-builder
WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

FROM python:3.10-bullseye AS auth-runtime
WORKDIR /app

COPY auth_service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY auth_service ./
COPY --from=frontend-builder /frontend/dist ./frontend_dist

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
