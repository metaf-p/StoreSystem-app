import { PRODUCTS_API_URL } from "../config";
import { parseApiResponse } from "../lib/http";
import type { PaginatedProductsResponse, Product, ProductPayload, Supplier } from "../types";

export type AuthorizedFetch = <T>(url: string, init?: RequestInit) => Promise<T>;

type ListProductsParams = {
  page?: number;
  limit?: number;
  name?: string;
};

function buildProductsUrl(params: ListProductsParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 10));

  if (params.name?.trim()) {
    query.set("name", params.name.trim());
  }

  return `${PRODUCTS_API_URL}/products/?${query.toString()}`;
}

function normalizeProductsResponse(response: PaginatedProductsResponse | Product[], page: number, limit: number) {
  if (Array.isArray(response)) {
    return {
      products: response.slice(0, limit),
      total: response.length,
      page,
      page_size: limit,
      total_pages: response.length ? Math.ceil(response.length / limit) : 0,
    };
  }

  return response;
}

export async function listProducts(fetcher: AuthorizedFetch, params: ListProductsParams = {}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const response = await fetcher<PaginatedProductsResponse | Product[]>(buildProductsUrl({ ...params, page, limit }));
  return normalizeProductsResponse(response, page, limit);
}

export function searchProducts(fetcher: AuthorizedFetch, name: string, params: Omit<ListProductsParams, "name"> = {}) {
  return listProducts(fetcher, { ...params, name });
}

export function getProduct(fetcher: AuthorizedFetch, productId: string) {
  return fetcher<Product>(`${PRODUCTS_API_URL}/products/${productId}`);
}

export function createProduct(fetcher: AuthorizedFetch, payload: ProductPayload) {
  return fetcher<Product>(`${PRODUCTS_API_URL}/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateProduct(fetcher: AuthorizedFetch, productId: string, payload: ProductPayload) {
  return fetcher<Product>(`${PRODUCTS_API_URL}/products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(fetcher: AuthorizedFetch, productId: string) {
  return fetcher<{ detail?: string }>(`${PRODUCTS_API_URL}/products/${productId}`, {
    method: "DELETE",
  });
}

export function listSuppliers(fetcher: AuthorizedFetch) {
  return fetcher<Supplier[]>(`${PRODUCTS_API_URL}/suppliers/`);
}

export async function uploadImage(accessToken: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${PRODUCTS_API_URL}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });
  return parseApiResponse<{ imageUrl: string }>(response);
}
