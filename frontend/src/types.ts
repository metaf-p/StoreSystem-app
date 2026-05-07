export type UserRole = "customer" | "operator" | "admin";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type UserSortField = "name" | "email" | "role";

export type UserUpdateResponse = {
  detail: string;
  user: AdminUser;
};

export type DeleteUserResponse = {
  detail: string;
};

export type SortOrder = "asc" | "desc";

export type PaginatedUsersResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type PaginatedProductsResponse = {
  products: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export type LoginResponse = {
  user_id: string;
  message: string;
  access_token: string;
  token_type: string;
};

export type RefreshTokenResponse = {
  user_id: string | null;
  access_token: string | null;
};

export type Product = {
  product_id: string;
  user_id?: string;
  name: string;
  description: string | null;
  category: string | null;
  price: string | number;
  stock_quantity: number;
  supplier_id: string;
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
  image_url: string | null;
  weight: string | number | null;
  dimensions: string | null;
  manufacturer: string | null;
};

export type Warehouse = {
  warehouse_id: string;
  location: string;
  manager_name: string | null;
  capacity: number;
  current_stock: number;
  contact_number: string | null;
  email: string | null;
  is_active: boolean;
  area_size: string | number | null;
};

export type WarehousePayload = {
  location: string;
  manager_name: string | null;
  capacity: number;
  current_stock: number;
  contact_number: string | null;
  email: string | null;
  is_active: boolean;
  area_size: string | number | null;
};

export type ProductWarehouse = {
  product_warehouse_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
};

export type WarehouseProduct = {
  product_id: string;
  supplier_id: string;
  name: string;
  price: string | number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
};

export type WarehouseProductRow = Product & {
  product_warehouse_id: string;
  quantity: number;
};

export type ProductFilter = {
  name?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
};

export type ProductPayload = {
  name: string;
  description: string | null;
  category: string | null;
  price: string;
  stock_quantity: number;
  supplier_id: string;
  image_url: string | null;
  weight: string | null;
  dimensions: string | null;
  manufacturer: string | null;
};

export type Supplier = {
  supplier_id: string;
  name: string;
  contact_name: string;
  contact_email: string;
  phone_number?: string;
  address?: string;
  country?: string;
  city?: string;
  website?: string;
};

export type CartItem = {
  product_id: string;
  name: string;
  price: string;
  quantity: number;
  max_quantity: number;
  warehouse_id: string;
  image_url: string | null;
};

export type OrderStatus = "pending" | "completed" | "cancelled";

export type OrderItem = {
  productId: string;
  warehouseId: string;
  quantity: number;
  priceAtOrder: string | number;
};

export type Order = {
  orderId: string;
  userId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  orderItems: OrderItem[];
};

export type AdminOrder = Order;

export type CartCheckoutItem = {
  productId: string;
  warehouseId: string;
  quantity: number;
  priceAtOrder: number;
};

export type CreateOrderInput = {
  orderItems: CartCheckoutItem[];
};

export type SupplierPayload = {
  name: string;
  contact_name: string;
  contact_email: string;
  phone_number: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
};

export type SupplierDocumentType = "contract" | "certificate" | "requisites" | "price_list" | "other";

export type SupplierDocument = {
  document_id: string;
  supplier_id: string;
  document_type: SupplierDocumentType;
  original_filename: string;
  content_type?: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  description?: string;
};

export type Chat = {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  participants: string[];
};

export type ChatMessage = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ChatCreatePayload = {
  name: string;
  is_group: boolean;
  participants: string[];
};

export type UserNameCache = Record<string, string>;
