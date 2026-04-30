import type { CartItem, WarehouseProduct } from "../types";

const CART_STORAGE_KEY = "cart";

export type CartItemIdentity = Pick<CartItem, "product_id" | "warehouse_id">;

export type CartMutationResult = {
  nextCart: CartItem[];
  applied: boolean;
  capped: boolean;
};

function formatStoredPrice(price: string | number) {
  const numericPrice = typeof price === "number" ? price : Number(price);
  if (Number.isFinite(numericPrice)) {
    return numericPrice.toFixed(2);
  }
  return String(price);
}

function normalizeCartItem(rawItem: unknown): CartItem | null {
  if (!rawItem || typeof rawItem !== "object") {
    return null;
  }

  const item = rawItem as Partial<CartItem> & { price?: unknown; quantity?: unknown; max_quantity?: unknown };
  if (typeof item.product_id !== "string" || typeof item.name !== "string" || typeof item.warehouse_id !== "string") {
    return null;
  }

  const quantity = Number(item.quantity);
  const maxQuantity = Number(item.max_quantity);
  if (!Number.isFinite(quantity) || !Number.isFinite(maxQuantity)) {
    return null;
  }

  return {
    product_id: item.product_id,
    name: item.name,
    price: formatStoredPrice(item.price ?? "0"),
    quantity: Math.max(0, Math.trunc(quantity)),
    max_quantity: Math.max(0, Math.trunc(maxQuantity)),
    warehouse_id: item.warehouse_id,
    image_url: typeof item.image_url === "string" ? item.image_url : null,
  };
}

function findCartItemIndex(cart: CartItem[], target: CartItemIdentity) {
  return cart.findIndex(
    (item) => item.product_id === target.product_id && item.warehouse_id === target.warehouse_id,
  );
}

export function loadCart() {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!savedCart) {
    return [] as CartItem[];
  }

  try {
    const parsed = JSON.parse(savedCart);
    if (!Array.isArray(parsed)) {
      return [] as CartItem[];
    }
    return parsed.map(normalizeCartItem).filter((item): item is CartItem => item !== null);
  } catch {
    return [] as CartItem[];
  }
}

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export function clearCart() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }

  return [] as CartItem[];
}

export function getCartCount(cart: CartItem[]) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => {
    const price = Number(item.price);
    return Number.isFinite(price) ? sum + price * item.quantity : sum;
  }, 0);
}

export function removeCartItem(cart: CartItem[], target: CartItemIdentity) {
  return cart.filter((item) => item.product_id !== target.product_id || item.warehouse_id !== target.warehouse_id);
}

export function changeCartItemQuantity(cart: CartItem[], target: CartItemIdentity, delta: number): CartMutationResult {
  const existingIndex = findCartItemIndex(cart, target);
  if (existingIndex < 0 || !Number.isFinite(delta) || delta === 0) {
    return { nextCart: cart, applied: false, capped: false };
  }

  const existingItem = cart[existingIndex];
  const nextQuantity = existingItem.quantity + Math.trunc(delta);

  if (nextQuantity <= 0) {
    return {
      nextCart: removeCartItem(cart, target),
      applied: true,
      capped: false,
    };
  }

  if (nextQuantity > existingItem.max_quantity) {
    return { nextCart: cart, applied: false, capped: true };
  }

  const nextCart = [...cart];
  nextCart[existingIndex] = {
    ...existingItem,
    quantity: nextQuantity,
  };

  return { nextCart, applied: true, capped: false };
}

export function upsertCartItem(
  cart: CartItem[],
  product: Pick<WarehouseProduct, "product_id" | "name" | "price" | "image_url" | "stock_quantity">,
  warehouseId: string,
) {
  if (product.stock_quantity <= 0) {
    return { nextCart: cart, applied: false, capped: true };
  }

  const nextCart = [...cart];
  const existingIndex = findCartItemIndex(nextCart, { product_id: product.product_id, warehouse_id: warehouseId });

  if (existingIndex >= 0) {
    const existingItem = nextCart[existingIndex];
    if (existingItem.quantity >= existingItem.max_quantity) {
      return { nextCart: cart, applied: false, capped: true };
    }

    nextCart[existingIndex] = {
      ...existingItem,
      quantity: existingItem.quantity + 1,
    };
    return { nextCart, applied: true, capped: false };
  }

  nextCart.push({
    product_id: product.product_id,
    name: product.name,
    price: formatStoredPrice(product.price),
    quantity: 1,
    max_quantity: product.stock_quantity,
    warehouse_id: warehouseId,
    image_url: product.image_url,
  });

  return { nextCart, applied: true, capped: false };
}
