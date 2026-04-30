# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /frontend

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_AUTH_API_URL=/api/auth
ARG VITE_PRODUCTS_API_URL=/api/products
ARG VITE_ORDERS_API_URL=/api/orders
ARG VITE_CHAT_API_URL=/api/chat
ARG VITE_CHAT_WS_URL=/ws

ENV VITE_AUTH_API_URL=${VITE_AUTH_API_URL}
ENV VITE_PRODUCTS_API_URL=${VITE_PRODUCTS_API_URL}
ENV VITE_ORDERS_API_URL=${VITE_ORDERS_API_URL}
ENV VITE_CHAT_API_URL=${VITE_CHAT_API_URL}
ENV VITE_CHAT_WS_URL=${VITE_CHAT_WS_URL}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /frontend/dist /usr/share/nginx/html/app

EXPOSE 80
