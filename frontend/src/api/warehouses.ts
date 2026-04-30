import { PRODUCTS_API_URL } from "../config";
import type { AuthorizedFetch } from "./products";
import type {
  ProductFilter,
  ProductWarehouse,
  Warehouse,
  WarehousePayload,
  WarehouseProduct,
} from "../types";

type WarehouseUpdatePayload = Partial<WarehousePayload>;

function buildWarehouseProductsUrl(warehouseId: string, filters?: ProductFilter) {
  const params = new URLSearchParams();

  if (filters?.name) {
    params.set("name", filters.name);
  }
  if (typeof filters?.min_price === "number") {
    params.set("min_price", String(filters.min_price));
  }
  if (typeof filters?.max_price === "number") {
    params.set("max_price", String(filters.max_price));
  }
  if (typeof filters?.in_stock === "boolean") {
    params.set("in_stock", String(filters.in_stock));
  }

  const query = params.toString();
  return `${PRODUCTS_API_URL}/productinwarehouses/${warehouseId}/products${query ? `?${query}` : ""}`;
}

export function listWarehouses(fetcher: AuthorizedFetch) {
  return fetcher<Warehouse[]>(`${PRODUCTS_API_URL}/warehouses/`);
}

export function getWarehouse(fetcher: AuthorizedFetch, warehouseId: string) {
  return fetcher<Warehouse>(`${PRODUCTS_API_URL}/warehouses/${warehouseId}`);
}

export function createWarehouse(fetcher: AuthorizedFetch, payload: WarehousePayload) {
  return fetcher<Warehouse>(`${PRODUCTS_API_URL}/warehouses/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateWarehouse(fetcher: AuthorizedFetch, warehouseId: string, payload: WarehouseUpdatePayload) {
  return fetcher<Warehouse>(`${PRODUCTS_API_URL}/warehouses/${warehouseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteWarehouse(fetcher: AuthorizedFetch, warehouseId: string) {
  return fetcher<{ message?: string }>(`${PRODUCTS_API_URL}/warehouses/${warehouseId}`, {
    method: "DELETE",
  });
}

export function listWarehouseProducts(fetcher: AuthorizedFetch, warehouseId: string, filters?: ProductFilter) {
  return fetcher<WarehouseProduct[]>(buildWarehouseProductsUrl(warehouseId, filters));
}

export function listProductsInWarehouse(fetcher: AuthorizedFetch, warehouseId: string) {
  return fetcher<ProductWarehouse[]>(`${PRODUCTS_API_URL}/productinwarehouses/${warehouseId}`);
}

export function addProductToWarehouse(fetcher: AuthorizedFetch, warehouseId: string, productId: string, quantity: number) {
  return fetcher<ProductWarehouse>(
    `${PRODUCTS_API_URL}/productinwarehouses?warehouse_id=${encodeURIComponent(warehouseId)}&product_id=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(String(quantity))}`,
    {
      method: "POST",
    },
  );
}

export function updateProductInWarehouse(
  fetcher: AuthorizedFetch,
  productId: string,
  productWarehouseId: string,
  quantity: number,
) {
  return fetcher<ProductWarehouse>(
    `${PRODUCTS_API_URL}/productinwarehouses/${encodeURIComponent(productId)}?product_warehouse_id=${encodeURIComponent(productWarehouseId)}&quantity=${encodeURIComponent(String(quantity))}`,
    {
      method: "PUT",
    },
  );
}

export function deleteProductFromWarehouse(fetcher: AuthorizedFetch, productId: string, productWarehouseId: string) {
  return fetcher<{ message?: string }>(
    `${PRODUCTS_API_URL}/productinwarehouses/${encodeURIComponent(productId)}?product_warehouse_id=${encodeURIComponent(productWarehouseId)}`,
    {
      method: "DELETE",
    },
  );
}
