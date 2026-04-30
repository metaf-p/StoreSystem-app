import { ORDERS_API_URL } from "../config";
import type { CartItem, CreateOrderInput, Order, OrderStatus } from "../types";
import type { AuthorizedFetch } from "./products";

type GraphQLError = {
  message?: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

type CreateOrderResult = {
  createOrder: {
    orderId: string;
    status: string;
  };
};

type ListOrdersResult = {
  listOrders: Order[];
};

type ListAllOrdersResult = {
  listAllOrders: Order[];
};

type UpdateOrderStatusResult = {
  updateOrderStatus: Order;
};

export type OrderDocumentKind = "invoice" | "shipment";

const CREATE_ORDER_MUTATION = `
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      orderId
      status
      createdAt
      updatedAt
      orderItems {
        productId
        warehouseId
        quantity
        priceAtOrder
      }
    }
  }
`;

const LIST_ORDERS_QUERY = `
  query ListOrders {
    listOrders {
      orderId
      userId
      status
      createdAt
      updatedAt
      orderItems {
        productId
        warehouseId
        quantity
        priceAtOrder
      }
    }
  }
`;

const LIST_ALL_ORDERS_QUERY = `
  query ListAllOrders {
    listAllOrders {
      orderId
      userId
      status
      createdAt
      updatedAt
      orderItems {
        productId
        warehouseId
        quantity
        priceAtOrder
      }
    }
  }
`;

const UPDATE_ORDER_STATUS_MUTATION = `
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      orderId
      userId
      status
      createdAt
      updatedAt
      orderItems {
        productId
        warehouseId
        quantity
        priceAtOrder
      }
    }
  }
`;

function getGraphQLErrorMessage(errors?: GraphQLError[]) {
  return errors?.find((error) => typeof error.message === "string" && error.message.trim())?.message?.trim() || "";
}

async function requestOrdersGraphQL<TData, TVariables extends Record<string, unknown> | undefined = undefined>(
  fetcher: AuthorizedFetch,
  query: string,
  fallbackMessage: string,
  variables?: TVariables,
) {
  const response = await fetcher<GraphQLResponse<TData>>(`${ORDERS_API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables === undefined ? { query } : { query, variables }),
  });

  const graphQLError = getGraphQLErrorMessage(response.errors);
  if (graphQLError) {
    throw new Error(graphQLError);
  }

  if (!response.data) {
    throw new Error(fallbackMessage);
  }

  return response.data;
}

function toCreateOrderInput(cart: CartItem[]): CreateOrderInput {
  return {
    orderItems: cart.map((item) => ({
      productId: item.product_id,
      warehouseId: item.warehouse_id,
      quantity: item.quantity,
      priceAtOrder: Number(item.price),
    })),
  };
}

export async function checkoutCart(fetcher: AuthorizedFetch, cart: CartItem[]) {
  const data = await requestOrdersGraphQL<CreateOrderResult, { input: CreateOrderInput }>(
    fetcher,
    CREATE_ORDER_MUTATION,
    "Ошибка при оформлении заказа",
    { input: toCreateOrderInput(cart) },
  );

  if (!data.createOrder) {
    throw new Error("Ошибка при оформлении заказа");
  }

  return data.createOrder;
}

export async function listMyOrders(fetcher: AuthorizedFetch) {
  const data = await requestOrdersGraphQL<ListOrdersResult>(fetcher, LIST_ORDERS_QUERY, "Ошибка при загрузке заказов");
  return data.listOrders;
}

export async function listAllOrders(fetcher: AuthorizedFetch) {
  const data = await requestOrdersGraphQL<ListAllOrdersResult>(fetcher, LIST_ALL_ORDERS_QUERY, "Ошибка при загрузке заказов");
  return data.listAllOrders;
}

export async function cancelOrder(fetcher: AuthorizedFetch, orderId: string) {
  const data = await requestOrdersGraphQL<UpdateOrderStatusResult, { input: { orderId: string; status: OrderStatus } }>(
    fetcher,
    UPDATE_ORDER_STATUS_MUTATION,
    "Ошибка при отмене заказа",
    {
      input: {
        orderId,
        status: "cancelled",
      },
    },
  );

  if (!data.updateOrderStatus) {
    throw new Error("Ошибка при отмене заказа");
  }

  return data.updateOrderStatus;
}

export async function downloadOrderDocument(accessToken: string, orderId: string, kind: OrderDocumentKind) {
  if (typeof window === "undefined") {
    throw new Error("Ошибка при скачивании документа.");
  }

  const response = await fetch(`${ORDERS_API_URL}/orders/${orderId}/documents/${kind}.pdf`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Ошибка при скачивании документа.");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `${kind}-${orderId}.pdf`;
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}
