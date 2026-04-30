import { PRODUCTS_API_URL } from "../config";
import { ApiError, parseApiResponse } from "../lib/http";
import type { AuthorizedFetch } from "./products";
import type { Supplier, SupplierDocument, SupplierPayload } from "../types";

export function listSuppliers(fetcher: AuthorizedFetch) {
  return fetcher<Supplier[]>(`${PRODUCTS_API_URL}/suppliers/`);
}

export function searchSuppliers(fetcher: AuthorizedFetch, name: string) {
  return fetcher<Supplier[]>(`${PRODUCTS_API_URL}/search_suppliers/?name=${encodeURIComponent(name)}`);
}

export function getSupplier(fetcher: AuthorizedFetch, supplierId: string) {
  return fetcher<Supplier>(`${PRODUCTS_API_URL}/suppliers/${supplierId}`);
}

export function createSupplier(fetcher: AuthorizedFetch, payload: SupplierPayload) {
  return fetcher<Supplier>(`${PRODUCTS_API_URL}/suppliers/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateSupplier(fetcher: AuthorizedFetch, supplierId: string, payload: SupplierPayload) {
  return fetcher<Supplier>(`${PRODUCTS_API_URL}/suppliers/${supplierId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteSupplier(fetcher: AuthorizedFetch, supplierId: string) {
  return fetcher<{ message?: string }>(`${PRODUCTS_API_URL}/suppliers/${supplierId}`, {
    method: "DELETE",
  });
}

export function listSupplierDocuments(fetcher: AuthorizedFetch, supplierId: string) {
  return fetcher<SupplierDocument[]>(`${PRODUCTS_API_URL}/suppliers/${supplierId}/documents`);
}

async function authorizedBinaryFetch(
  accessToken: string,
  refreshAccessToken: () => Promise<string | null>,
  url: string,
  init: RequestInit,
) {
  const makeRequest = (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
    });

  let response = await makeRequest(accessToken);
  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      throw new ApiError("Unauthorized", 401);
    }
    response = await makeRequest(refreshedToken);
  }

  return response;
}

export async function uploadSupplierDocument(
  accessToken: string,
  refreshAccessToken: () => Promise<string | null>,
  supplierId: string,
  file: File,
  documentType: SupplierDocument["document_type"],
  description: string | null,
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("document_type", documentType);
  formData.append("description", description || "");

  const response = await authorizedBinaryFetch(accessToken, refreshAccessToken, `${PRODUCTS_API_URL}/suppliers/${supplierId}/documents`, {
    method: "POST",
    body: formData,
  });

  return parseApiResponse<SupplierDocument>(response);
}

export async function downloadSupplierDocument(
  accessToken: string,
  refreshAccessToken: () => Promise<string | null>,
  supplierId: string,
  documentId: string,
) {
  const response = await authorizedBinaryFetch(accessToken, refreshAccessToken, `${PRODUCTS_API_URL}/suppliers/${supplierId}/documents/${documentId}/download`, {
    method: "GET",
  });

  if (!response.ok) {
    await parseApiResponse(response);
  }

  return response.blob();
}

export function deleteSupplierDocument(fetcher: AuthorizedFetch, supplierId: string, documentId: string) {
  return fetcher<{ message?: string }>(`${PRODUCTS_API_URL}/suppliers/${supplierId}/documents/${documentId}`, {
    method: "DELETE",
  });
}
