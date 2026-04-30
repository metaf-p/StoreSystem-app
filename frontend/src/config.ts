export const AUTH_API_URL =
  import.meta.env.VITE_AUTH_API_URL?.replace(/\/$/, "") || "http://localhost:8001";

export const PRODUCTS_API_URL =
  import.meta.env.VITE_PRODUCTS_API_URL?.replace(/\/$/, "") || "http://localhost:8002";

export const ORDERS_API_URL =
  import.meta.env.VITE_ORDERS_API_URL?.replace(/\/$/, "") || "http://localhost:8003";

export const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL?.replace(/\/$/, "") || "http://localhost:8004";

function normalizeChatWsBase(value?: string) {
  if (!value) {
    return null;
  }

  const trimmed = value.replace(/\/$/, "");
  if (!trimmed || trimmed === "/ws") {
    return null;
  }

  if (trimmed.endsWith("/ws")) {
    return trimmed.slice(0, -3);
  }

  if (trimmed.startsWith("/")) {
    return null;
  }

  return trimmed;
}

function deriveChatWsUrl(apiUrl: string) {
  if (apiUrl.startsWith("https://")) {
    return apiUrl.replace(/^https:\/\//, "wss://");
  }

  if (apiUrl.startsWith("http://")) {
    return apiUrl.replace(/^http:\/\//, "ws://");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.protocol === "https:"
      ? window.location.origin.replace(/^https:/, "wss:")
      : window.location.origin.replace(/^http:/, "ws:");
  }

  return apiUrl;
}

export const CHAT_WS_URL =
  normalizeChatWsBase(import.meta.env.VITE_CHAT_WS_URL) || deriveChatWsUrl(CHAT_API_URL);
