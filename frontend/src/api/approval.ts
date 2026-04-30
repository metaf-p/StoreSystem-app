import { AUTH_API_URL, PRODUCTS_API_URL } from "../config";
import type { Product } from "../types";
import type { AuthorizedFetch } from "./products";

export function listPendingProducts(fetcher: AuthorizedFetch) {
  return fetcher<Product[]>(`${AUTH_API_URL}/get-pending-products/`);
}

export function removeFromPending(fetcher: AuthorizedFetch, productId: string) {
  return fetcher<{ detail?: string }>(`${AUTH_API_URL}/remove-from-pending/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId }),
  });
}

export function markPendingProductAvailable(fetcher: AuthorizedFetch, productId: string) {
  return fetcher<Product>(`${PRODUCTS_API_URL}/products/${productId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_available: true }),
  });
}
