#!/bin/sh
set -eu

CERT_DIR=/etc/nginx/certs
CERT_FILE="$CERT_DIR/server.crt"
KEY_FILE="$CERT_DIR/server.key"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
  mkdir -p "$CERT_DIR"
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -subj "/CN=store.example.com" \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" >/dev/null 2>&1
fi

exec nginx -g "daemon off;"
