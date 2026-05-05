import { expect, test } from "@playwright/test";
import type { Page, Route } from "@playwright/test";

type UserRole = "customer" | "operator" | "admin";
type OrderStatus = "pending" | "completed" | "cancelled";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type Product = {
  product_id: string;
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

type Supplier = {
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

type SupplierDocument = {
  document_id: string;
  supplier_id: string;
  document_type: string;
  original_filename: string;
  content_type: string | null;
  file_size: number;
  uploaded_by: string;
  created_at: string;
  description: string | null;
};

type Warehouse = {
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

type WarehouseProduct = {
  product_id: string;
  supplier_id: string;
  name: string;
  price: string | number;
  description: string | null;
  image_url: string | null;
  stock_quantity: number;
};

type ProductWarehouseSeed = {
  product_warehouse_id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
};

type CartItemSeed = {
  product_id: string;
  name: string;
  price: string;
  quantity: number;
  max_quantity: number;
  warehouse_id: string;
  image_url: string | null;
};

type OrderItemSeed = {
  productId: string;
  warehouseId: string;
  quantity: number;
  priceAtOrder: string | number;
};

type ShipmentOrderSeed = {
  orderId: string;
  userId?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  orderItems: OrderItemSeed[];
};

type ChatSeed = {
  id: string;
  name: string;
  is_group: boolean;
  created_at: string;
  participants: string[];
};

type ChatMessageSeed = {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ChatCreatePayloadSeed = {
  name: string;
  is_group: boolean;
  participants: string[];
};

const operatorUser: User = {
  id: "user-operator",
  name: "Operator",
  email: "operator@example.com",
  role: "operator",
};

const customerUser: User = {
  id: "user-customer",
  name: "Customer",
  email: "customer@example.com",
  role: "customer",
};

const adminUser: User = {
  id: "user-admin",
  name: "Admin",
  email: "admin@example.com",
  role: "admin",
};

const sampleUserListUsers: User[] = [
  adminUser,
  {
    id: "user-anna",
    name: "Anna Petrova",
    email: "anna.petrova@example.com",
    role: "customer",
  },
  {
    id: "user-boris",
    name: "Boris Ivanov",
    email: "boris.ivanov@example.com",
    role: "operator",
  },
  {
    id: "user-catherine",
    name: "Catherine Lee",
    email: "catherine.lee@example.com",
    role: "customer",
  },
  customerUser,
  {
    id: "user-dmitry",
    name: "Dmitry Orlov",
    email: "dmitry.orlov@example.com",
    role: "operator",
  },
  {
    id: "user-elena",
    name: "Elena Smirnova",
    email: "elena.smirnova@example.com",
    role: "customer",
  },
  {
    id: "user-fedor",
    name: "Fedor Kozlov",
    email: "fedor.kozlov@example.com",
    role: "customer",
  },
  {
    id: "user-galina",
    name: "Galina Morozova",
    email: "galina.morozova@example.com",
    role: "operator",
  },
  {
    id: "user-igor",
    name: "Igor Petrov",
    email: "igor.petrov@example.com",
    role: "customer",
  },
  {
    id: "user-julia",
    name: "Julia Sidorova",
    email: "julia.sidorova@example.com",
    role: "customer",
  },
  operatorUser,
];

const sampleProducts: Product[] = [
  {
    product_id: "product-1",
    name: "Test Product",
    description: "Demo product",
    category: "Demo",
    price: "12.50",
    stock_quantity: 10,
    supplier_id: "supplier-1",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
];

const samplePendingProducts: Product[] = [
  {
    product_id: "pending-product-1",
    name: "Pending Product Alpha",
    description: "Awaiting approval",
    category: "Demo",
    price: "15.00",
    stock_quantity: 8,
    supplier_id: "supplier-1",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
  {
    product_id: "pending-product-2",
    name: "Pending Product Beta",
    description: "Second item in queue",
    category: "Demo",
    price: "25.00",
    stock_quantity: 12,
    supplier_id: "supplier-2",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
];

const sampleSuppliers: Supplier[] = [
  {
    supplier_id: "supplier-1",
    name: "Demo Supplier",
    contact_name: "Demo Contact",
    contact_email: "demo.supplier@example.com",
    phone_number: "+79990000001",
    address: "Demo street 1",
    country: "Russia",
    city: "Moscow",
    website: "https://demo-supplier.example.com",
  },
  {
    supplier_id: "supplier-2",
    name: "Second Supplier",
    contact_name: "Second Contact",
    contact_email: "second.supplier@example.com",
  },
];

const sampleWarehouses: Warehouse[] = [
  {
    warehouse_id: "warehouse-1",
    location: "Central Warehouse",
    manager_name: "Anna",
    capacity: 1000,
    current_stock: 50,
    contact_number: "+79990000001",
    email: "central@example.com",
    is_active: true,
    area_size: "1200.50",
  },
  {
    warehouse_id: "warehouse-2",
    location: "North Warehouse",
    manager_name: "Ivan",
    capacity: 500,
    current_stock: 0,
    contact_number: null,
    email: null,
    is_active: true,
    area_size: null,
  },
];

const sampleWarehouseDetailProducts: Product[] = [
  {
    product_id: "warehouse-product-1",
    name: "Warehouse Bolt",
    description: "Fastening part",
    category: "Hardware",
    price: "7.50",
    stock_quantity: 20,
    supplier_id: "supplier-1",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
  {
    product_id: "warehouse-product-2",
    name: "Warehouse Panel",
    description: "Storage panel",
    category: "Hardware",
    price: "21.00",
    stock_quantity: 12,
    supplier_id: "supplier-2",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
  {
    product_id: "warehouse-product-3",
    name: "Warehouse Label",
    description: "Inventory label",
    category: "Hardware",
    price: "3.25",
    stock_quantity: 40,
    supplier_id: "supplier-1",
    image_url: null,
    weight: null,
    dimensions: null,
    manufacturer: null,
  },
];

const sampleWarehouseProductEntries: Record<string, ProductWarehouseSeed[]> = {
  "warehouse-1": [
    {
      product_warehouse_id: "product-warehouse-1",
      product_id: "warehouse-product-1",
      warehouse_id: "warehouse-1",
      quantity: 4,
    },
    {
      product_warehouse_id: "product-warehouse-2",
      product_id: "warehouse-product-2",
      warehouse_id: "warehouse-1",
      quantity: 2,
    },
  ],
  "warehouse-2": [],
};

const sampleWarehouseProducts: Record<string, WarehouseProduct[]> = {
  "warehouse-1": [
    {
      product_id: "catalog-product-1",
      supplier_id: "supplier-1",
      name: "Space Hammer",
      price: "15.00",
      description: "Heavy duty tool",
      image_url: null,
      stock_quantity: 3,
    },
    {
      product_id: "catalog-product-2",
      supplier_id: "supplier-2",
      name: "Orbit Drill",
      price: "25.00",
      description: "Precision drill",
      image_url: null,
      stock_quantity: 2,
    },
    {
      product_id: "catalog-product-3",
      supplier_id: "supplier-2",
      name: "Out of Stock Widget",
      price: "9.99",
      description: "Unavailable item",
      image_url: null,
      stock_quantity: 0,
    },
  ],
  "warehouse-2": [],
};

const sampleSupplierDocuments: SupplierDocument[] = [
  {
    document_id: "document-1",
    supplier_id: "supplier-1",
    document_type: "contract",
    original_filename: "contract.pdf",
    content_type: "application/pdf",
    file_size: 2048,
    uploaded_by: "user-operator",
    created_at: "2026-04-26T10:00:00.000Z",
    description: "Demo contract",
  },
];

const sampleAdminOrders: ShipmentOrderSeed[] = [
  {
    orderId: "order-admin-pending",
    userId: customerUser.id,
    status: "pending",
    createdAt: "2026-04-25T11:30:00.000Z",
    updatedAt: "2026-04-25T12:00:00.000Z",
    orderItems: [
      {
        productId: "admin-product-1",
        warehouseId: "warehouse-1",
        quantity: 1,
        priceAtOrder: "10.00",
      },
    ],
  },
  {
    orderId: "order-admin-completed",
    userId: operatorUser.id,
    status: "completed",
    createdAt: "2026-04-24T09:00:00.000Z",
    updatedAt: "2026-04-24T10:00:00.000Z",
    orderItems: [
      {
        productId: "admin-product-2",
        warehouseId: "warehouse-1",
        quantity: 2,
        priceAtOrder: "20.00",
      },
    ],
  },
  {
    orderId: "order-admin-cancelled",
    userId: adminUser.id,
    status: "cancelled",
    createdAt: "2026-04-23T08:15:00.000Z",
    updatedAt: "2026-04-23T09:00:00.000Z",
    orderItems: [
      {
        productId: "admin-product-3",
        warehouseId: "warehouse-2",
        quantity: 3,
        priceAtOrder: "30.00",
      },
    ],
  },
];

const sampleChatUsers: User[] = [
  customerUser,
  operatorUser,
  adminUser,
  {
    id: "user-alice",
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    role: "customer",
  },
  {
    id: "user-bob",
    name: "Bob Stone",
    email: "bob.stone@example.com",
    role: "operator",
  },
];

const sampleChats: ChatSeed[] = [
  {
    id: "chat-support",
    name: "Поддержка",
    is_group: false,
    created_at: "2026-04-25T09:00:00.000Z",
    participants: [customerUser.id, operatorUser.id],
  },
  {
    id: "chat-team",
    name: "Команда",
    is_group: true,
    created_at: "2026-04-24T08:30:00.000Z",
    participants: [operatorUser.id, adminUser.id, "user-alice"],
  },
];

const sampleChatMessages: Record<string, ChatMessageSeed[]> = {
  "chat-support": [
    {
      id: "chat-support-msg-1",
      chat_id: "chat-support",
      sender_id: customerUser.id,
      content: "Здравствуйте, нужна помощь.",
      created_at: "2026-04-25T09:10:00.000Z",
    },
    {
      id: "chat-support-msg-2",
      chat_id: "chat-support",
      sender_id: operatorUser.id,
      content: "Добрый день, сейчас посмотрим.",
      created_at: "2026-04-25T09:12:00.000Z",
    },
  ],
  "chat-team": [
    {
      id: "chat-team-msg-1",
      chat_id: "chat-team",
      sender_id: "user-alice",
      content: "Проверьте новый заказ, пожалуйста.",
      created_at: "2026-04-24T08:40:00.000Z",
    },
  ],
};

test("login shows field validation and login error message", async ({ page }) => {
  await mockAnonymousSession(page);
  await mockLoginFailure(page);

  await page.goto("/app/login");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByText("Email обязателен для заполнения.")).toBeVisible();
  await expect(page.getByText("Пароль обязателен для заполнения.")).toBeVisible();

  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Пароль").fill("wrong-password");
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByTestId("login-error")).toHaveText("Неверный email или пароль.");
});

test("register shows field validation messages", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/register");
  await page.getByRole("button", { name: "Зарегистрироваться" }).click();

  await expect(page.getByText("Имя пользователя обязательно для заполнения.")).toBeVisible();
  await expect(page.getByText("Email обязателен для заполнения.")).toBeVisible();
  await expect(page.getByText("Пароль обязателен для заполнения.")).toBeVisible();
});

test("auth_service serves the React shell on /app/login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("http://127.0.0.1:8001/app/login");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("legacy auth routes redirect to the React auth pages", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("http://127.0.0.1:8001/login");
  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.goto("http://127.0.0.1:8001/register");
  await expect(page).toHaveURL(/\/app\/register$/);
  await expect(page.getByRole("heading", { name: "Регистрация" })).toBeVisible();
});

test("legacy products route redirects to the React login page for anonymous users", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("http://127.0.0.1:8001/products");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("legacy warehouse detail route redirects to the React detail page", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, {
    warehouses: sampleWarehouses,
    products: sampleWarehouseDetailProducts,
    warehouseProducts: sampleWarehouseProductEntries,
  });

  await page.goto("http://127.0.0.1:8001/warehouses_detail/warehouse-1");

  await expect(page).toHaveURL(/\/app\/warehouses\/warehouse-1$/);
  await expect(page.locator("h1")).toContainText("Central Warehouse");
});

test("legacy admin orders route redirects to the React admin orders page", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("http://127.0.0.1:8001/admin_orders");

  await expect(page).toHaveURL(/\/app\/admin-orders$/);
  await expect(page.getByRole("heading", { name: "Администрирование заказов" })).toBeVisible();
});

test("legacy chat route redirects to the React chat page", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("http://127.0.0.1:8001/chat-ui");

  await expect(page).toHaveURL(/\/app\/chat$/);
  await expect(page.getByRole("heading", { name: "Чат-центр" })).toBeVisible();
});

test("unauthenticated access to products redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/products");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("unauthenticated access to pending approval redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/pending-approval");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer gets redirected from pending approval to products", async ({ page }) => {
  await mockCustomerSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/pending-approval");

  await expect(page).toHaveURL(/\/app\/products$/);
  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
});

test("products page renders for operator and shows write controls", async ({ page }) => {
  await mockOperatorSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/products");

  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить новый продукт" })).toBeVisible();
  await expect(page.getByText("Test Product")).toBeVisible();
  await page.getByRole("button", { name: "Test Product" }).click();
  await expect(page.getByText("Поставщик:")).toBeVisible();
  await expect(page.getByText("Demo Supplier")).toBeVisible();
});

test("operator sees pending approval table", async ({ page }) => {
  await mockPendingApprovalSession(page, samplePendingProducts);

  await page.goto("/app/pending-approval");

  await expect(page.getByRole("heading", { name: "Продукты на согласование" })).toBeVisible();
  await expect(page.getByText("Pending Product Alpha")).toBeVisible();
  await expect(page.getByText("Pending Product Beta")).toBeVisible();
});

test("pending approval empty state shows no products message", async ({ page }) => {
  await mockPendingApprovalSession(page, []);

  await page.goto("/app/pending-approval");

  await expect(page.getByText("Нет продуктов на согласование")).toBeVisible();
});

test("pending approval load error is shown in table state", async ({ page }) => {
  await mockOperatorSession(page, [], sampleSuppliers);
  await page.route("**://localhost:8001/get-pending-products/**", async (route) => {
    await fulfillJson(route, 500, { detail: "Ошибка загрузки очереди" });
  });

  await page.goto("/app/pending-approval");

  await expect(page.getByText("Ошибка загрузки очереди")).toBeVisible();
});

test("unauthenticated access to user list redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/user-list");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer gets redirected from user list to products", async ({ page }) => {
  await mockCatalogSession(page, customerUser);

  await page.goto("/app/user-list");

  await expect(page).toHaveURL(/\/app\/products$/);
  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
});

test("operator gets redirected from user list to products", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/user-list");

  await expect(page).toHaveURL(/\/app\/products$/);
  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
});

test("navbar hides the users link for operator", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/products");

  await expect(page.getByRole("link", { name: "Пользователи" })).toHaveCount(0);
});

test("navbar shows the users link for admin", async ({ page }) => {
  await mockCatalogSession(page, adminUser);

  await page.goto("/app/products");

  await expect(page.getByRole("link", { name: "Пользователи" })).toBeVisible();
});

test("admin sees the user table and the initial load uses default query params", async ({ page }) => {
  const state = await mockUserListSession(page, adminUser);

  await page.goto("/app/user-list");

  await expect(page.getByRole("heading", { name: "Управление пользователями" })).toBeVisible();
  await expect(page.getByTestId("user-row-user-admin")).toBeVisible();
  expect(state.requestLog[0]).toBe("http://localhost:8001/users?page=1&page_size=10&sort_by=name&order=asc");
});

test("user list empty state shows no users message", async ({ page }) => {
  await mockUserListSession(page, adminUser, { users: [] });

  await page.goto("/app/user-list");

  await expect(page.getByText("Пользователи не найдены")).toBeVisible();
});

test("user list load errors are shown in the table state", async ({ page }) => {
  await mockUserListSession(page, adminUser, {
    loadError: "Ошибка загрузки пользователей",
  });

  await page.goto("/app/user-list");

  await expect(page.getByRole("cell", { name: "Ошибка загрузки пользователей" })).toBeVisible();
});

test("user list search debounce, filters, page size, sort and pagination use server params", async ({ page }) => {
  const state = await mockUserListSession(page, adminUser);

  await page.goto("/app/user-list");
  await page.getByLabel("Поиск").fill("Julia");
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("search=Julia"))).toBe(true);

  await page.getByLabel("Фильтр роли").selectOption("operator");
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("role=operator"))).toBe(true);

  await page.getByLabel("На странице").selectOption("20");
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("page_size=20") && entry.includes("page=1"))).toBe(true);

  await page.getByRole("button", { name: "Email" }).click();
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("sort_by=email") && entry.includes("order=asc"))).toBe(true);

  await page.getByRole("button", { name: "Email" }).click();
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("sort_by=email") && entry.includes("order=desc"))).toBe(true);

  await page.getByRole("button", { name: "Сбросить" }).click();
  await expect.poll(() => state.requestLog[state.requestLog.length - 1]).toBe(
    "http://localhost:8001/users?page=1&page_size=10&sort_by=name&order=asc",
  );

  await page.getByRole("button", { name: "2" }).click();
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("page=2"))).toBe(true);
});

test("changing a user role updates the backend and reloads the list", async ({ page }) => {
  const state = await mockUserListSession(page, adminUser);

  await page.goto("/app/user-list");
  await page.getByTestId("user-role-select-user-anna").selectOption("operator");

  await expect(page.getByText("Роль пользователя обновлена")).toBeVisible();
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("PUT /users/user-anna/role:operator"))).toBe(true);
  await expect(page.getByTestId("user-row-user-anna")).toContainText("Оператор");
});

test("cannot remove the last admin role and the role select is restored", async ({ page }) => {
  const state = await mockUserListSession(page, adminUser);

  await page.goto("/app/user-list");
  await page.getByTestId("user-role-select-user-admin").selectOption("customer");

  await expect(page.getByText("Cannot remove the last admin role")).toBeVisible();
  await expect.poll(() => state.requestLog.some((entry) => entry.includes("PUT /users/user-admin/role:customer"))).toBe(true);
  await expect(page.getByTestId("user-row-user-admin")).toContainText("Администратор");
});

test("approve updates queue and calls patch/remove in order", async ({ page }) => {
  const state = await mockPendingApprovalSession(page, samplePendingProducts);

  await page.goto("/app/pending-approval");
  const targetRow = page.locator("tr").filter({ hasText: "Pending Product Alpha" });

  await targetRow.getByRole("button", { name: "Одобрить" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Одобрить продукт?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Одобрить" }).click();

  await expect(page.locator("tr").filter({ hasText: "Pending Product Alpha" })).toHaveCount(0);
  await expect(page.getByText("Pending Product Beta")).toBeVisible();
  expect(state.requestLog).toEqual(["PATCH pending-product-1", "POST remove pending-product-1"]);
});

test("reject updates queue and calls remove/delete in order", async ({ page }) => {
  const state = await mockPendingApprovalSession(page, [samplePendingProducts[0]]);

  await page.goto("/app/pending-approval");
  const targetRow = page.locator("tr").filter({ hasText: "Pending Product Alpha" });

  await targetRow.getByRole("button", { name: "Отклонить" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Отклонить продукт?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Отклонить" }).click();

  await expect(page.getByText("Нет продуктов на согласование")).toBeVisible();
  expect(state.requestLog).toEqual(["POST remove pending-product-1", "DELETE pending-product-1"]);
});

test("approve shows patch error toast and keeps the row", async ({ page }) => {
  const state = await mockPendingApprovalSession(page, [samplePendingProducts[0]], {
    patchFailures: ["pending-product-1"],
  });

  await page.goto("/app/pending-approval");
  const targetRow = page.locator("tr").filter({ hasText: "Pending Product Alpha" });

  await targetRow.getByRole("button", { name: "Одобрить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Одобрить" }).click();

  await expect(page.getByText("Ошибка обновления продукта")).toBeVisible();
  await expect(page.getByText("Pending Product Alpha")).toBeVisible();
  expect(state.requestLog).toEqual(["PATCH pending-product-1"]);
});

test("approve shows remove-from-pending error toast and keeps the row", async ({ page }) => {
  const state = await mockPendingApprovalSession(page, [samplePendingProducts[0]], {
    removeFailures: ["pending-product-1"],
  });

  await page.goto("/app/pending-approval");
  const targetRow = page.locator("tr").filter({ hasText: "Pending Product Alpha" });

  await targetRow.getByRole("button", { name: "Одобрить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Одобрить" }).click();

  await expect(page.getByText("Ошибка удаления из очереди")).toBeVisible();
  await expect(page.getByText("Pending Product Alpha")).toBeVisible();
  expect(state.requestLog).toEqual(["PATCH pending-product-1", "POST remove pending-product-1"]);
});

test("reject shows delete error toast and clears the queue", async ({ page }) => {
  const state = await mockPendingApprovalSession(page, [samplePendingProducts[0]], {
    deleteFailures: ["pending-product-1"],
  });

  await page.goto("/app/pending-approval");
  const targetRow = page.locator("tr").filter({ hasText: "Pending Product Alpha" });

  await targetRow.getByRole("button", { name: "Отклонить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Отклонить" }).click();

  await expect(page.getByText("Ошибка удаления продукта")).toBeVisible();
  await expect(page.getByText("Нет продуктов на согласование")).toBeVisible();
  expect(state.requestLog).toEqual(["POST remove pending-product-1", "DELETE pending-product-1"]);
});

test("suppliers page renders all supplier fields in the table", async ({ page }) => {
  await mockOperatorSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/suppliers");

  await expect(page.getByRole("heading", { name: "Управление поставщиками" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить нового поставщика" })).toBeVisible();
  const demoRow = page.locator("tr").filter({ hasText: "Demo Supplier" });
  await expect(demoRow).toHaveCount(1);
  await expect(demoRow.getByText("Demo Contact")).toBeVisible();
  await expect(demoRow.getByText("demo.supplier@example.com")).toBeVisible();
  await expect(demoRow.getByText("+79990000001")).toBeVisible();
  await expect(demoRow.getByText("Russia")).toBeVisible();
  await expect(demoRow.getByText("Moscow")).toBeVisible();
  await expect(demoRow.getByText("Demo street 1")).toBeVisible();
  await expect(demoRow.getByRole("link", { name: "https://demo-supplier.example.com" })).toBeVisible();
  await demoRow.getByRole("button", { name: "Документы" }).click();
  await expect(page.getByRole("heading", { name: "Документы: Demo Supplier" })).toBeVisible();
  await expect(page.getByText("contract.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: "Загрузить документ" })).toBeVisible();
});

test("suppliers page search filters the list", async ({ page }) => {
  await mockOperatorSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/suppliers");
  await page.getByLabel("Поиск").fill("Second");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText("Second Supplier")).toBeVisible();
  await expect(page.getByText("Demo Supplier")).toHaveCount(0);
});

test("authenticated session survives page reload", async ({ page }) => {
  await mockOperatorSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/products");
  await expect(page.getByText("Test Product")).toBeVisible();

  await page.reload();

  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
  await expect(page.getByText("Test Product")).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить новый продукт" })).toBeVisible();
});

test("customer can view products but not write controls", async ({ page }) => {
  await mockCustomerSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/products");

  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
  await expect(page.getByText("Test Product")).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить новый продукт" })).toHaveCount(0);
});

test("customer can view suppliers but not write controls", async ({ page }) => {
  await mockCustomerSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/suppliers");

  await expect(page.getByRole("heading", { name: "Управление поставщиками" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Demo Supplier")).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить нового поставщика" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Документы" }).first()).toBeVisible();
  await page.getByRole("button", { name: "Документы" }).first().click();
  await expect(page.getByRole("button", { name: "Загрузить документ" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Редактировать" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(0);
});

test("unauthenticated access to warehouses redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/warehouses");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer sees warehouses without write controls", async ({ page }) => {
  await mockWarehousesSession(page, customerUser);

  await page.goto("/app/warehouses");

  await expect(page.getByRole("heading", { name: "Управление складами" })).toBeVisible();
  await expect(page.getByRole("table").getByText("Central Warehouse")).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить новый склад" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Редактировать" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(0);
});

test("operator sees warehouse create edit and delete controls", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser);

  await page.goto("/app/warehouses");

  await expect(page.getByRole("button", { name: "Добавить новый склад" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Редактировать" })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(2);
});

test("warehouses page shows empty state", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, { warehouses: [] });

  await page.goto("/app/warehouses");

  await expect(page.getByRole("cell", { name: "Склады не найдены." })).toBeVisible();
});

test("warehouses page shows load errors in table state", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, { warehousesLoadError: "Ошибка загрузки складов" });

  await page.goto("/app/warehouses");

  await expect(page.getByRole("cell", { name: "Ошибка загрузки складов" })).toBeVisible();
});

test("create edit and delete warehouse operations refresh the list", async ({ page }) => {
  const state = await mockWarehousesSession(page, operatorUser, {
    warehouses: [sampleWarehouses[0], sampleWarehouses[1]],
  });

  await page.goto("/app/warehouses");
  await page.getByRole("button", { name: "Добавить новый склад" }).click();
  await page.getByLabel("Местоположение").fill("New Warehouse");
  await page.getByLabel("Имя управляющего").fill("NewManager");
  await page.getByLabel("Вместимость").fill("250");
  await page.getByLabel("Текущий запас").fill("0");
  await page.getByLabel("Контактный телефон").fill("+79990000055");
  await page.getByLabel("Контактный email").fill("new@example.com");
  await page.getByLabel("Площадь").fill("100.25");
  await page.getByRole("button", { name: "Создать склад" }).click();

  await expect(page.getByRole("table").getByText("New Warehouse")).toBeVisible();

  const createdRow = page.locator("tr").filter({ hasText: "New Warehouse" });
  await createdRow.getByRole("button", { name: "Редактировать" }).click();
  await page.getByLabel("Местоположение").fill("Updated Warehouse");
  await page.getByRole("button", { name: "Сохранить изменения" }).click();

  await expect(page.getByRole("table").getByText("Updated Warehouse")).toBeVisible();

  const updatedRow = page.locator("tr").filter({ hasText: "Updated Warehouse" });
  await updatedRow.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();

  await expect(page.getByText("Updated Warehouse")).toHaveCount(0);
  expect(state.requestLog).toEqual([
    "GET /warehouses/",
    "GET /warehouses/",
    "POST /warehouses/",
    "GET /warehouses/",
    "PATCH /warehouses/warehouse-new-1",
    "GET /warehouses/",
    "DELETE /warehouses/warehouse-new-1",
    "GET /warehouses/",
  ]);
});

test("warehouse detail link routes to the React detail page", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser);

  await page.goto("/app/warehouses");

  await expect(page.getByRole("link", { name: "Посмотреть" }).first()).toHaveAttribute(
    "href",
    "/app/warehouses/warehouse-1",
  );
});

test("warehouse detail page loads warehouse and products", async ({ page }) => {
  await mockWarehousesSession(page, customerUser, {
    warehouses: sampleWarehouses,
    products: sampleWarehouseDetailProducts,
    warehouseProducts: sampleWarehouseProductEntries,
  });

  await page.goto("/app/warehouses/warehouse-1");

  await expect(page.getByRole("heading", { name: "Central Warehouse", level: 1 })).toBeVisible();
  await expect(page.getByText("Warehouse Bolt")).toBeVisible();
  await expect(page.locator("tr").filter({ hasText: "Warehouse Bolt" })).toContainText("4");
  await expect(page.getByRole("button", { name: "Добавить продукт на склад" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Редактировать" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Удалить" })).toHaveCount(0);
});

test("warehouse detail page shows error state for invalid warehouse id", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser);

  await page.goto("/app/warehouses/not-a-uuid");

  await expect(page.getByRole("main").getByText("Warehouse not found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Вернуться к складам" })).toBeVisible();
});

test("warehouse detail page shows error state when warehouse is missing", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, { warehouses: [] });

  await page.goto("/app/warehouses/00000000-0000-4000-8000-000000000000");

  await expect(page.getByRole("main").getByText("Warehouse not found")).toBeVisible();
  await expect(page.getByRole("link", { name: "Вернуться к складам" })).toBeVisible();
});

test("operator can add update and delete warehouse products", async ({ page }) => {
  const state = await mockWarehousesSession(page, operatorUser, {
    warehouses: [sampleWarehouses[0]],
    products: sampleWarehouseDetailProducts,
    warehouseProducts: {
      "warehouse-1": [
        {
          product_warehouse_id: "product-warehouse-1",
          product_id: "warehouse-product-1",
          warehouse_id: "warehouse-1",
          quantity: 4,
        },
        {
          product_warehouse_id: "product-warehouse-2",
          product_id: "warehouse-product-2",
          warehouse_id: "warehouse-1",
          quantity: 2,
        },
      ],
    },
  });

  await page.goto("/app/warehouses/warehouse-1");
  await page.getByRole("button", { name: "Добавить продукт на склад" }).click();
  const addDialog = page.getByRole("dialog", { name: "Добавить продукт на склад" });
  await addDialog.getByLabel("ID товара").fill("warehouse-product-3");
  await addDialog.getByLabel("Количество").fill("5");
  await addDialog.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByRole("cell", { name: "Warehouse Label" })).toBeVisible();

  const addedRow = page.locator("tr").filter({ hasText: "Warehouse Label" });
  await addedRow.getByRole("button", { name: "Редактировать" }).click();
  const editDialog = page.getByRole("dialog", { name: "Редактировать количество" });
  await editDialog.getByLabel("Количество").fill("7");
  await editDialog.getByRole("button", { name: "Сохранить" }).click();

  await expect(addedRow).toContainText("7");

  await addedRow.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();

  await expect(page.getByRole("cell", { name: "Warehouse Label" })).toHaveCount(0);
  expect(state.requestLog).toContain("POST /productinwarehouses?warehouse_id=warehouse-1&product_id=warehouse-product-3&quantity=5");
  expect(state.requestLog).toContain(
    "PUT /productinwarehouses/warehouse-product-3?product_warehouse_id=product-warehouse-new-1&quantity=7",
  );
  expect(state.requestLog).toContain(
    "DELETE /productinwarehouses/warehouse-product-3?product_warehouse_id=product-warehouse-new-1",
  );
});

test("add product errors show a toast", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, {
    warehouses: [sampleWarehouses[0]],
    products: sampleWarehouseDetailProducts,
    warehouseProducts: {
      "warehouse-1": [],
    },
    addProductError: "Ошибка добавления товара",
  });

  await page.goto("/app/warehouses/warehouse-1");
  await page.getByRole("button", { name: "Добавить продукт на склад" }).click();
  const addDialog = page.getByRole("dialog", { name: "Добавить продукт на склад" });
  await addDialog.getByLabel("ID товара").fill("warehouse-product-3");
  await addDialog.getByLabel("Количество").fill("1");
  await addDialog.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByText("Ошибка добавления товара")).toBeVisible();
});

test("update product errors show a toast", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, {
    warehouses: [sampleWarehouses[0]],
    products: sampleWarehouseDetailProducts,
    warehouseProducts: {
      "warehouse-1": [
        {
          product_warehouse_id: "product-warehouse-1",
          product_id: "warehouse-product-1",
          warehouse_id: "warehouse-1",
          quantity: 4,
        },
      ],
    },
    updateProductError: "Ошибка обновления товара",
  });

  await page.goto("/app/warehouses/warehouse-1");
  const row = page.locator("tr").filter({ hasText: "Warehouse Bolt" });
  await row.getByRole("button", { name: "Редактировать" }).click();
  const editDialog = page.getByRole("dialog", { name: "Редактировать количество" });
  await editDialog.getByLabel("Количество").fill("6");
  await editDialog.getByRole("button", { name: "Сохранить" }).click();

  await expect(page.getByText("Ошибка обновления товара")).toBeVisible();
  await expect(row).toContainText("4");
});

test("delete product errors show a toast", async ({ page }) => {
  await mockWarehousesSession(page, operatorUser, {
    warehouses: [sampleWarehouses[0]],
    products: sampleWarehouseDetailProducts,
    warehouseProducts: {
      "warehouse-1": [
        {
          product_warehouse_id: "product-warehouse-1",
          product_id: "warehouse-product-1",
          warehouse_id: "warehouse-1",
          quantity: 4,
        },
      ],
    },
    deleteProductError: "Ошибка удаления товара",
  });

  await page.goto("/app/warehouses/warehouse-1");
  const row = page.locator("tr").filter({ hasText: "Warehouse Bolt" });
  await row.getByRole("button", { name: "Удалить" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Удалить" }).click();

  await expect(page.getByText("Ошибка удаления товара")).toBeVisible();
  await expect(row).toBeVisible();
});

test("logout clears the session and returns to login", async ({ page }) => {
  await mockOperatorSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/products");
  await expect(page.getByText("Test Product")).toBeVisible();

  await page.getByRole("link", { name: "Выйти" }).click();

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

  await page.goto("/app/products");
  await expect(page).toHaveURL(/\/app\/login$/);
});

test("products table shows loading state while data is pending", async ({ page }) => {
  let releaseProducts: (() => void) | undefined;
  const productsGate = new Promise<void>((resolve) => {
    releaseProducts = resolve;
  });

  await mockOperatorSession(page, [], sampleSuppliers, {
    productsHandler: async (route) => {
      await productsGate;
      await fulfillJson(route, 200, []);
    },
  });

  await page.goto("/app/products");
  await expect(page.getByRole("status")).toBeVisible();

  releaseProducts?.();
  await expect(page.getByText("Продукты не найдены")).toBeVisible();
});

test("products table shows empty state", async ({ page }) => {
  await mockOperatorSession(page, [], sampleSuppliers);

  await page.goto("/app/products");
  await expect(page.getByText("Продукты не найдены")).toBeVisible();
});

test("products table shows error state when API fails", async ({ page }) => {
  await mockOperatorSession(page, [], sampleSuppliers, {
    productsHandler: async (route) => {
      await fulfillJson(route, 500, { detail: "Ошибка загрузки продуктов" });
    },
  });

  await page.goto("/app/products");
  await expect(page.getByText("Ошибка загрузки продуктов")).toBeVisible();
});

test("unauthenticated access to orders redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/orders");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer sees the orders catalog page", async ({ page }) => {
  await mockCatalogSession(page, customerUser);

  await page.goto("/app/orders");

  await expect(page.getByRole("heading", { name: "Каталог товаров" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Корзина/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Мои отгрузки" })).toHaveAttribute("href", "/app/shipments");
  await expect(page.getByRole("link", { name: "Админка заказов" })).toHaveCount(0);
});

test("operator sees the admin orders link", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");

  await expect(page.getByRole("link", { name: "Админка заказов" })).toBeVisible();
});

test("admin sees the admin orders link", async ({ page }) => {
  await mockCatalogSession(page, adminUser);

  await page.goto("/app/orders");

  await expect(page.getByRole("link", { name: "Админка заказов" })).toBeVisible();
});

test("warehouse list loads and selecting warehouse shows products", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await expect(page.getByLabel("Склад")).toBeVisible();

  await page.getByLabel("Склад").selectOption("warehouse-1");

  await expect(page.getByText("Space Hammer")).toBeVisible();
  await expect(page.getByText("Orbit Drill")).toBeVisible();
  await expect(page.getByRole("button", { name: "Добавить в корзину" })).toBeVisible();
});

test("orders page shows empty state when warehouses list is empty", async ({ page }) => {
  await mockCatalogSession(page, operatorUser, { warehouses: [] });

  await page.goto("/app/orders");

  await expect(page.getByText("Склады не найдены.")).toBeVisible();
  await expect(page.getByText("Выберите склад, чтобы увидеть товары")).toBeVisible();
});

test("orders page shows empty state for an empty warehouse", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-2");

  await expect(page.getByText("Товары не найдены")).toBeVisible();
});

test("search calls warehouse products endpoint with name and resets filters", async ({ page }) => {
  const state = await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-1");
  await expect(page.getByText("Space Hammer")).toBeVisible();

  await page.getByLabel("Минимальная цена").fill("20");
  await page.getByLabel("Максимальная цена").fill("30");
  await page.getByRole("checkbox", { name: "Только в наличии" }).click();
  await page.getByLabel("Поиск по названию").fill("Orbit");
  await page.getByRole("button", { name: "Найти" }).click();

  await expect(page.getByText("Orbit Drill")).toBeVisible();
  await expect(page.getByText("Space Hammer")).toHaveCount(0);
  await expect(page.getByLabel("Минимальная цена")).toHaveValue("0");
  await expect(page.getByLabel("Максимальная цена")).toHaveValue("10000");
  await expect(page.getByRole("checkbox", { name: "Только в наличии" })).not.toBeChecked();

  const searchRequests = state.requestLog.filter((entry) => entry.includes("/productinwarehouses/warehouse-1/products"));
  const lastRequest = searchRequests[searchRequests.length - 1];
  expect(lastRequest).toContain("name=Orbit");
  expect(lastRequest).not.toContain("min_price=");
  expect(lastRequest).not.toContain("max_price=");
  expect(lastRequest).not.toContain("in_stock=");
});

test("filters call endpoint with min_price max_price in_stock and current query", async ({ page }) => {
  const state = await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-1");
  await page.getByLabel("Поиск по названию").fill("Orbit");
  await page.getByLabel("Минимальная цена").fill("20");
  await page.getByLabel("Максимальная цена").fill("30");
  await page.getByRole("checkbox", { name: "Только в наличии" }).click();
  await page.getByRole("button", { name: "Применить" }).click();

  await expect(page.getByText("Orbit Drill")).toBeVisible();

  const filteredRequests = state.requestLog.filter((entry) => entry.includes("/productinwarehouses/warehouse-1/products"));
  const lastRequest = filteredRequests[filteredRequests.length - 1];
  expect(lastRequest).toContain("name=Orbit");
  expect(lastRequest).toContain("min_price=20");
  expect(lastRequest).toContain("max_price=30");
  expect(lastRequest).toContain("in_stock=true");
});

test("adding a product writes a compatible cart item to localStorage", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-1");
  await page.getByRole("button", { name: "Добавить в корзину" }).first().click();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<Record<string, unknown>>);

  expect(cart).toEqual([
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 1,
      max_quantity: 3,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);
});

test("re-adding the same product increases quantity up to max_quantity", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-1");

  const addButton = page.getByRole("button", { name: "Добавить в корзину" }).first();
  await addButton.click();
  await addButton.click();
  await addButton.click();
  await addButton.click();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ quantity: number }>);

  expect(cart[0].quantity).toBe(3);
  await expect(page.getByText("Достигнуто максимальное количество на складе")).toBeVisible();
});

test("orders page shows warehouse load errors in toast and error state", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);
  await page.route("**://localhost:8002/warehouses/**", async (route) => {
    await fulfillJson(route, 500, { detail: "Ошибка загрузки складов" });
  });

  await page.goto("/app/orders");

  await expect(page.getByText("Ошибка загрузки складов")).toBeVisible();
});

test("orders page shows product load errors in toast and error state", async ({ page }) => {
  await mockCatalogSession(page, operatorUser);
  await page.route("**://localhost:8002/productinwarehouses/warehouse-1/products**", async (route) => {
    await fulfillJson(route, 500, { detail: "Ошибка загрузки товаров" });
  });

  await page.goto("/app/orders");
  await page.getByLabel("Склад").selectOption("warehouse-1");

  await expect(page.getByText("Ошибка загрузки товаров")).toBeVisible();
});

test("orders page cart button routes to the React cart page", async ({ page }) => {
  await mockCatalogSession(page, customerUser);

  await page.goto("/app/orders");

  await expect(page.getByRole("link", { name: /Корзина/ })).toHaveAttribute("href", "/app/cart");
});

test("unauthenticated access to cart redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/cart");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("empty cart shows empty state and disabled checkout", async ({ page }) => {
  await mockCartSession(page, customerUser);

  await page.goto("/app/cart");

  await expect(page.getByText("Корзина пуста")).toBeVisible();
  await expect(page.getByRole("button", { name: "Оформить заказ" })).toBeDisabled();
});

test("cart renders items from localStorage and shows the total", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 2,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
    {
      product_id: "catalog-product-2",
      name: "Orbit Drill",
      price: "25.00",
      quantity: 1,
      max_quantity: 2,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");

  await expect(page.getByText("Space Hammer")).toBeVisible();
  await expect(page.getByText("Orbit Drill")).toBeVisible();
  await expect(page.locator("aside")).toContainText("55.00 ₽");
});

test("+ increases quantity and updates localStorage cart", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 1,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");
  const row = page.locator("article").filter({ hasText: "Space Hammer" });

  await row.getByRole("button", { name: "+" }).click();

  await expect(row.getByText("2", { exact: true })).toBeVisible();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ quantity: number }>);
  expect(cart[0].quantity).toBe(2);
});

test("+ above max_quantity does not change the cart and shows a toast", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 5,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");
  const row = page.locator("article").filter({ hasText: "Space Hammer" });

  await row.getByRole("button", { name: "+" }).click();

  await expect(page.getByText("Достигнуто максимальное количество на складе")).toBeVisible();
  await expect(row.getByText("5", { exact: true })).toBeVisible();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ quantity: number }>);
  expect(cart[0].quantity).toBe(5);
});

test("- decreases quantity and removes the item at zero", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 2,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");
  const row = page.locator("article").filter({ hasText: "Space Hammer" });

  await row.getByRole("button", { name: "-" }).first().click();
  await expect(row.getByText("1", { exact: true })).toBeVisible();

  await row.getByRole("button", { name: "-" }).first().click();

  await expect(page.getByText("Корзина пуста")).toBeVisible();
  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<unknown>);
  expect(cart).toEqual([]);
});

test("Удалить removes the row and updates the total", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 2,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
    {
      product_id: "catalog-product-2",
      name: "Orbit Drill",
      price: "25.00",
      quantity: 1,
      max_quantity: 2,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");
  const hammerRow = page.locator("article").filter({ hasText: "Space Hammer" });

  await hammerRow.getByRole("button", { name: "Удалить" }).click();

  await expect(page.getByText("Space Hammer")).toHaveCount(0);
  await expect(page.locator("aside")).toContainText("25.00 ₽");
});

test("checkout submits GraphQL mutation, clears the cart and shows success toast", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 2,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  let checkoutRequest: { headers: Record<string, string>; body: { query?: string; variables?: { input?: { orderItems?: Array<Record<string, unknown>> } } } } | null = null;
  await page.route("**://localhost:8003/graphql", async (route) => {
    checkoutRequest = {
      headers: route.request().headers(),
      body: route.request().postDataJSON() as {
        query?: string;
        variables?: { input?: { orderItems?: Array<Record<string, unknown>> } };
      },
    };

    await fulfillJson(route, 200, {
      data: {
        createOrder: {
          orderId: "order-1",
          status: "CREATED",
        },
      },
    });
  });

  await page.goto("/app/cart");
  await page.getByRole("button", { name: "Оформить заказ" }).click();

  await expect(page.getByText("Заказ успешно оформлен")).toBeVisible();
  await expect(page.getByText("Корзина пуста")).toBeVisible();
  expect(checkoutRequest?.headers.authorization).toBe("Bearer test-access-token");
  expect(checkoutRequest?.body.query).toContain("mutation CreateOrder");
  expect(checkoutRequest?.body.variables?.input?.orderItems).toEqual([
    {
      productId: "catalog-product-1",
      warehouseId: "warehouse-1",
      quantity: 2,
      priceAtOrder: 15,
    },
  ]);

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<unknown>);
  expect(cart).toEqual([]);
});

test("checkout GraphQL errors show a toast and keep the cart", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 2,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.route("**://localhost:8003/graphql", async (route) => {
    await fulfillJson(route, 200, {
      errors: [{ message: "Недостаточно товара на складе" }],
    });
  });

  await page.goto("/app/cart");
  await page.getByRole("button", { name: "Оформить заказ" }).click();

  await expect(page.getByText("Недостаточно товара на складе")).toBeVisible();
  await expect(page.getByText("Space Hammer")).toBeVisible();

  const cart = await page.evaluate(() => JSON.parse(localStorage.getItem("cart") || "[]") as Array<{ quantity: number }>);
  expect(cart[0].quantity).toBe(2);
});

test("return to catalog link goes to the orders page", async ({ page }) => {
  await mockCartSession(page, customerUser, [
    {
      product_id: "catalog-product-1",
      name: "Space Hammer",
      price: "15.00",
      quantity: 1,
      max_quantity: 5,
      warehouse_id: "warehouse-1",
      image_url: null,
    },
  ]);

  await page.goto("/app/cart");
  await page.getByRole("link", { name: "Вернуться к каталогу" }).click();

  await expect(page).toHaveURL(/\/app\/orders$/);
  await expect(page.getByRole("heading", { name: "Каталог товаров" })).toBeVisible();
});

test("unauthenticated access to shipments redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/shipments");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer sees their shipments sorted by createdAt descending", async ({ page }) => {
  const shipments = [
    {
      orderId: "order-old",
      userId: customerUser.id,
      status: "completed" as const,
      createdAt: "2026-04-24T09:00:00.000Z",
      updatedAt: "2026-04-24T10:00:00.000Z",
      orderItems: [
        {
          productId: "product-old-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "12.50",
        },
      ],
    },
    {
      orderId: "order-new",
      userId: customerUser.id,
      status: "pending" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
      orderItems: [
        {
          productId: "product-new-1",
          warehouseId: "warehouse-2",
          quantity: 2,
          priceAtOrder: "25.00",
        },
      ],
    },
  ] satisfies ShipmentOrderSeed[];

  await mockShipmentsSession(page, customerUser, shipments);

  await page.goto("/app/shipments");

  await expect(page.getByRole("heading", { name: "Мои отгрузки" })).toBeVisible();
  const cards = page.getByTestId("shipment-card");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toContainText("Заказ №order-new");
  await expect(cards.nth(1)).toContainText("Заказ №order-old");
  await expect(page.getByRole("button", { name: "Отменить заказ" })).toHaveCount(0);
});

test("shipments empty state shows no orders message", async ({ page }) => {
  await mockShipmentsSession(page, customerUser, []);

  await page.goto("/app/shipments");

  await expect(page.getByText("У вас пока нет заказов.")).toBeVisible();
});

test("shipments load errors are shown in the error state", async ({ page }) => {
  await mockShipmentsSession(page, customerUser, [], {
    loadError: "Ошибка загрузки заказов",
  });

  await page.goto("/app/shipments");

  await expect(page.getByRole("main").getByText("Ошибка загрузки заказов")).toBeVisible();
});

test("pending customer does not see a cancel button", async ({ page }) => {
  await mockShipmentsSession(page, customerUser, [
    {
      orderId: "order-pending",
      userId: customerUser.id,
      status: "pending" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      orderItems: [
        {
          productId: "product-pending-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "10.00",
        },
      ],
    },
  ]);

  await page.goto("/app/shipments");

  await expect(page.getByRole("button", { name: "Отменить заказ" })).toHaveCount(0);
});

test("operator can cancel a pending shipment and the list reloads", async ({ page }) => {
  const state = await mockShipmentsSession(page, operatorUser, [
    {
      orderId: "order-pending",
      userId: operatorUser.id,
      status: "pending" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      orderItems: [
        {
          productId: "product-pending-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "10.00",
        },
      ],
    },
  ]);

  await page.goto("/app/shipments");
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Отменить заказ?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Отменить" }).click();

  await expect(page.getByText("Заказ успешно отменен")).toBeVisible();
  await expect(page.getByText("cancelled")).toBeVisible();
  expect(state.requestLog.filter((entry) => entry === "listOrders")).toHaveLength(3);
  expect(state.requestLog.some((entry) => entry.includes("updateOrderStatus:order-pending:cancelled"))).toBe(true);
});

test("cancel mutation errors show a toast and keep the shipment list", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, [
    {
      orderId: "order-pending",
      userId: operatorUser.id,
      status: "pending" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      orderItems: [
        {
          productId: "product-pending-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "10.00",
        },
      ],
    },
  ], {
    cancelError: "Нельзя отменить заказ",
  });

  await page.goto("/app/shipments");
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Отменить" }).click();

  await expect(page.getByText("Нельзя отменить заказ")).toBeVisible();
  await expect(page.getByText("Заказ №order-pending")).toBeVisible();
  await expect(page.getByRole("main").getByText("pending", { exact: true })).toBeVisible();
});

test("invoice and shipment downloads call the REST endpoints with bearer token", async ({ page }) => {
  const state = await mockShipmentsSession(page, customerUser, [
    {
      orderId: "order-download",
      userId: customerUser.id,
      status: "completed" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      orderItems: [
        {
          productId: "product-download-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "10.00",
        },
      ],
    },
  ]);

  await page.goto("/app/shipments");
  await page.getByRole("button", { name: "Скачать счёт" }).click();
  await page.getByRole("button", { name: "Скачать отгрузочный документ" }).click();

  await expect.poll(() => state.downloadRequests.length).toBe(2);
  expect(state.downloadRequests.map((entry) => entry.url)).toEqual([
    "http://localhost:8003/orders/order-download/documents/invoice.pdf",
    "http://localhost:8003/orders/order-download/documents/shipment.pdf",
  ]);
  expect(state.downloadRequests.every((entry) => entry.authorization === "Bearer test-access-token")).toBe(true);
});

test("download errors show a toast", async ({ page }) => {
  await mockShipmentsSession(page, customerUser, [
    {
      orderId: "order-download-error",
      userId: customerUser.id,
      status: "completed" as const,
      createdAt: "2026-04-25T11:30:00.000Z",
      orderItems: [
        {
          productId: "product-download-1",
          warehouseId: "warehouse-1",
          quantity: 1,
          priceAtOrder: "10.00",
        },
      ],
    },
  ], {
    downloadFailures: [{ orderId: "order-download-error", kind: "invoice" }],
  });

  await page.goto("/app/shipments");
  await page.getByRole("button", { name: "Скачать счёт" }).click();

  await expect(page.getByText("Ошибка при скачивании документа.")).toBeVisible();
});

test("unauthenticated access to admin orders redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/admin-orders");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer gets redirected from admin orders to products", async ({ page }) => {
  await mockCustomerSession(page, sampleProducts, sampleSuppliers);

  await page.goto("/app/admin-orders");

  await expect(page).toHaveURL(/\/app\/products$/);
  await expect(page.getByRole("heading", { name: "Управление продуктами" })).toBeVisible();
});

test("operator sees the admin orders page", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");

  await expect(page.getByRole("heading", { name: "Администрирование заказов" })).toBeVisible();
  await expect(page.getByTestId("admin-order-card")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Отменить заказ" })).toHaveCount(1);
});

test("admin sees the admin orders page", async ({ page }) => {
  await mockShipmentsSession(page, adminUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");

  await expect(page.getByRole("heading", { name: "Администрирование заказов" })).toBeVisible();
  await expect(page.getByTestId("admin-order-card")).toHaveCount(3);
});

test("admin orders load via listAllOrders and render cards", async ({ page }) => {
  const state = await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");

  await expect(page.getByTestId("admin-order-card")).toHaveCount(3);
  expect(state.requestLog[0]).toBe("listAllOrders");
});

test("admin orders empty state shows no orders message", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, []);

  await page.goto("/app/admin-orders");

  await expect(page.getByText("Заказы не найдены")).toBeVisible();
});

test("admin orders status filter shows only the selected status", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");
  await page.getByLabel("Фильтр статуса").selectOption("completed");
  await page.getByRole("button", { name: "Применить" }).click();

  const cards = page.getByTestId("admin-order-card");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Заказ №order-admin-completed");
});

test("admin orders date filter shows only the selected date", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");
  await page.getByLabel("Дата создания").fill("2026-04-24");
  await page.getByRole("button", { name: "Применить" }).click();

  const cards = page.getByTestId("admin-order-card");
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText("Заказ №order-admin-completed");
});

test("admin orders reset button clears filters", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");
  await page.getByLabel("Фильтр статуса").selectOption("pending");
  await page.getByLabel("Дата создания").fill("2026-04-25");
  await page.getByRole("button", { name: "Применить" }).click();
  await expect(page.getByTestId("admin-order-card")).toHaveCount(1);

  await page.getByRole("button", { name: "Сбросить" }).click();

  await expect(page.getByTestId("admin-order-card")).toHaveCount(3);
});

test("pending admin order shows cancel action while completed and cancelled do not", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");

  await expect(page.getByRole("button", { name: "Отменить заказ" })).toHaveCount(1);
  await expect(page.getByTestId("admin-order-card").filter({ hasText: "Заказ №order-admin-completed" })).toContainText("completed");
  await expect(page.getByTestId("admin-order-card").filter({ hasText: "Заказ №order-admin-cancelled" })).toContainText("cancelled");
});

test("canceling a pending admin order calls updateOrderStatus and reloads the list", async ({ page }) => {
  const state = await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Отменить заказ?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Отменить" }).click();

  await expect(page.getByText("Заказ успешно отменен")).toBeVisible();
  await expect(page.getByText("Заказ №order-admin-pending")).toBeVisible();
  await expect(page.getByTestId("admin-order-card").filter({ hasText: "Заказ №order-admin-pending" })).toContainText("cancelled");
  expect(state.requestLog.filter((entry) => entry === "listAllOrders")).toHaveLength(3);
  expect(state.requestLog.some((entry) => entry.includes("updateOrderStatus:order-admin-pending:cancelled"))).toBe(true);
});

test("cancel errors show a toast on admin orders", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders, {
    cancelError: "Нельзя отменить заказ",
  });

  await page.goto("/app/admin-orders");
  await page.getByRole("button", { name: "Отменить заказ" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Отменить" }).click();

  await expect(page.getByText("Нельзя отменить заказ")).toBeVisible();
  await expect(page.getByText("Заказ №order-admin-pending")).toBeVisible();
});

test("invoice and shipment downloads call the REST endpoints with bearer token on admin orders", async ({ page }) => {
  const state = await mockShipmentsSession(page, operatorUser, sampleAdminOrders);

  await page.goto("/app/admin-orders");
  await page.getByRole("button", { name: "Скачать счёт" }).first().click();
  await page.getByRole("button", { name: "Скачать отгрузочный документ" }).first().click();

  await expect.poll(() => state.downloadRequests.length).toBe(2);
  expect(state.downloadRequests.map((entry) => entry.url)).toEqual([
    "http://localhost:8003/orders/order-admin-pending/documents/invoice.pdf",
    "http://localhost:8003/orders/order-admin-pending/documents/shipment.pdf",
  ]);
  expect(state.downloadRequests.every((entry) => entry.authorization === "Bearer test-access-token")).toBe(true);
});

test("download errors show a toast on admin orders", async ({ page }) => {
  await mockShipmentsSession(page, operatorUser, sampleAdminOrders, {
    downloadFailures: [{ orderId: "order-admin-pending", kind: "invoice" }],
  });

  await page.goto("/app/admin-orders");
  await page.getByRole("button", { name: "Скачать счёт" }).first().click();

  await expect(page.getByText("Ошибка при скачивании документа.")).toBeVisible();
});

test("unauthenticated access to chat redirects to login", async ({ page }) => {
  await mockAnonymousSession(page);

  await page.goto("/app/chat");

  await expect(page).toHaveURL(/\/app\/login$/);
  await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();
});

test("customer sees chats and does not see create or add participants controls", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");

  await expect(page.getByRole("heading", { name: "Чат-центр" })).toBeVisible();
  await expect(page.getByTestId("chat-list-item-chat-support")).toBeVisible();
  await expect(page.getByTestId("chat-list-item-chat-team")).toBeVisible();
  await expect(page.getByTestId("create-chat-button")).toHaveCount(0);
  await expect(page.getByTestId("chat-add-participants-chat-support")).toHaveCount(0);
});

test("operator sees create and add participants controls", async ({ page }) => {
  await mockChatSession(page, operatorUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");

  await expect(page.getByTestId("create-chat-button")).toBeVisible();
  await expect(page.getByTestId("chat-add-participants-chat-support")).toBeVisible();
});

test("admin sees create and add participants controls", async ({ page }) => {
  await mockChatSession(page, adminUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");

  await expect(page.getByTestId("create-chat-button")).toBeVisible();
  await expect(page.getByTestId("chat-add-participants-chat-team")).toBeVisible();
});

test("empty chats state shows no chats message", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: [],
    messagesByChatId: {},
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");

  await expect(page.getByText("Чаты не найдены")).toBeVisible();
});

test("selecting a chat opens a websocket with the correct URL and token", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();

  await expect.poll(() => getChatWebSocketSnapshot(page).then((sockets) => sockets.length > 0)).toBe(true);
  const sockets = await getChatWebSocketSnapshot(page);
  const latestSocket = sockets[sockets.length - 1];

  expect(latestSocket.url).toBe(
    "ws://localhost:8004/ws/chat-support/user-customer?token=test-access-token",
  );
});

test("incoming websocket messages render in the chat window", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();
  await expect.poll(() => getChatWebSocketSnapshot(page).then((sockets) => sockets.length > 0)).toBe(true);

  const sockets = await getChatWebSocketSnapshot(page);
  const latestIndex = sockets.length - 1;

  await emitChatWebSocketMessage(page, latestIndex, {
    id: "chat-support-msg-live",
    chat_id: "chat-support",
    sender_id: "user-bob",
    content: "Живое сообщение из WebSocket",
    created_at: "2026-04-25T09:20:00.000Z",
  });

  await expect(page.getByText("Живое сообщение из WebSocket")).toBeVisible();
  await expect(page.getByText("Bob Stone")).toBeVisible();
});

test("sending a message sends JSON payload through websocket", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();
  await expect.poll(() => getChatWebSocketSnapshot(page).then((sockets) => sockets.length > 0)).toBe(true);

  await page.getByTestId("chat-message-input").fill("Сообщение из UI");
  await page.getByTestId("chat-send-button").click();

  const sockets = await getChatWebSocketSnapshot(page);
  const latestSocket = sockets[sockets.length - 1];
  expect(latestSocket.sent.length).toBeGreaterThan(0);
  expect(JSON.parse(latestSocket.sent[latestSocket.sent.length - 1])).toEqual({ content: "Сообщение из UI" });
  await expect(page.getByText("Сообщение из UI")).toBeVisible();
});

test("empty and too long messages are blocked and show validation toasts", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();
  await expect.poll(() => getChatWebSocketSnapshot(page).then((sockets) => sockets.length > 0)).toBe(true);

  await page.getByTestId("chat-send-button").click();
  await expect(page.getByText("Введите сообщение.")).toBeVisible();

  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="chat-message-input"]') as HTMLInputElement | null;
    if (!input) {
      return;
    }

    const longValue = "а".repeat(1001);
    input.value = longValue;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

  await page.getByTestId("chat-send-button").click();
  await expect(page.getByText("Сообщение не должно превышать 1000 символов.")).toBeVisible();
  const sockets = await getChatWebSocketSnapshot(page);
  expect(sockets[sockets.length - 1].sent).toHaveLength(0);
});

test("history loads and renders messages in backend order", async ({ page }) => {
  const state = await mockChatSession(page, operatorUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();
  await page.getByTestId("chat-history-button").click();

  await expect(page.getByTestId("chat-message-chat-support-msg-1")).toContainText("Вы");
  await expect(page.getByTestId("chat-message-chat-support-msg-2")).toContainText("Operator");
  expect(state.requestLog.some((entry) => entry === "GET /chats/chat-support/messages")).toBe(true);
});

test("create chat includes the current user in participants and refreshes the list", async ({ page }) => {
  const state = await mockChatSession(page, adminUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("create-chat-button").click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByLabel("Название чата").fill("Новый чат для теста");
  await page.getByRole("checkbox", { name: "Alice Johnson (alice.johnson@example.com)" }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Создать чат" }).click();

  await expect(page.getByText("Чат успешно создан")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Новый чат для теста" })).toBeVisible();
  expect(state.createBodies.length).toBeGreaterThan(0);
  expect(state.createBodies[0]).toEqual({
    name: "Новый чат для теста",
    is_group: false,
    participants: [adminUser.id, "user-alice"],
  });
});

test("add participants calls PATCH for selected users", async ({ page }) => {
  const state = await mockChatSession(page, operatorUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-add-participants-chat-support").click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("checkbox", { name: "Alice Johnson (alice.johnson@example.com)" }).check();
  await page.getByRole("checkbox", { name: "Bob Stone (bob.stone@example.com)" }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Добавить участников" }).click();

  await expect(page.getByText("Участники добавлены в чат")).toBeVisible();
  expect(state.addUserRequests).toEqual([
    { chatId: "chat-support", userId: "user-alice" },
    { chatId: "chat-support", userId: "user-bob" },
  ]);
});

test("chat list load errors show the error state", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
    chatsLoadError: "Ошибка загрузки чатов",
  });

  await page.goto("/app/chat");

  await expect(page.getByTestId("chat-list-error")).toContainText("Ошибка загрузки чатов");
});

test("websocket errors show a toast", async ({ page }) => {
  await mockChatSession(page, customerUser, {
    chats: sampleChats,
    messagesByChatId: sampleChatMessages,
    users: sampleChatUsers,
  });

  await page.goto("/app/chat");
  await page.getByTestId("chat-open-chat-support").click();
  await expect.poll(() => getChatWebSocketSnapshot(page).then((sockets) => sockets.length > 0)).toBe(true);
  const sockets = await getChatWebSocketSnapshot(page);

  await emitChatWebSocketError(page, sockets.length - 1);
  await expect(page.getByText("Ошибка подключения к чату.")).toBeVisible();
});

async function mockAnonymousSession(page: Page) {
  await page.route("**://localhost:8001/refresh-token", async (route) => {
    await fulfillJson(route, 200, { user_id: null, access_token: null });
  });
}

async function mockLoginFailure(page: Page) {
  await page.route("**://localhost:8001/login", async (route) => {
    await fulfillJson(route, 400, { detail: "Invalid email or password" });
  });
}

async function mockPendingApprovalSession(
  page: Page,
  pendingProducts: Product[],
  options?: {
    patchFailures?: string[];
    removeFailures?: string[];
    deleteFailures?: string[];
  },
) {
  const state = {
    pendingProducts: [...pendingProducts],
    requestLog: [] as string[],
    patchFailures: new Set(options?.patchFailures ?? []),
    removeFailures: new Set(options?.removeFailures ?? []),
    deleteFailures: new Set(options?.deleteFailures ?? []),
  };

  await mockOperatorSession(page, [], []);

  await page.route("**://localhost:8001/get-pending-products/**", async (route) => {
    await fulfillJson(route, 200, state.pendingProducts);
  });

  await page.route("**://localhost:8001/remove-from-pending/**", async (route) => {
    const body = route.request().postDataJSON() as { product_id?: string };
    const productId = body.product_id || "";
    state.requestLog.push(`POST remove ${productId}`);

    if (state.removeFailures.has(productId)) {
      await fulfillJson(route, 500, { detail: "Ошибка удаления из очереди" });
      return;
    }

    state.pendingProducts = state.pendingProducts.filter((product) => product.product_id !== productId);
    await fulfillJson(route, 200, { detail: "Removed from pending" });
  });

  await page.route("**://localhost:8002/products/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const productId = url.split("/products/")[1];

    if (method === "PATCH") {
      state.requestLog.push(`PATCH ${productId}`);

      if (state.patchFailures.has(productId)) {
        await fulfillJson(route, 500, { detail: "Ошибка обновления продукта" });
        return;
      }

      const product = state.pendingProducts.find((entry) => entry.product_id === productId);
      await fulfillJson(route, 200, product ? { ...product, is_available: true } : { product_id: productId, is_available: true });
      return;
    }

    if (method === "DELETE") {
      state.requestLog.push(`DELETE ${productId}`);

      if (state.deleteFailures.has(productId)) {
        await fulfillJson(route, 500, { detail: "Ошибка удаления продукта" });
        return;
      }

      state.pendingProducts = state.pendingProducts.filter((product) => product.product_id !== productId);
      await fulfillJson(route, 200, { detail: "Deleted" });
      return;
    }

    await route.fallback();
  });

  return state;
}

async function mockOperatorSession(
  page: Page,
  products: Product[],
  suppliers: Supplier[],
  options?: {
    productsHandler?: (route: Route) => Promise<void>;
  },
) {
  let loggedOut = false;

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }
    await fulfillJson(route, 200, { user_id: operatorUser.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }
    await fulfillJson(route, 200, operatorUser);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8002/products/**", async (route) => {
    const url = route.request().url();

    if (options?.productsHandler && url.endsWith("/products/")) {
      await options.productsHandler(route);
      return;
    }

    if (url.endsWith("/products/")) {
      await fulfillJson(route, 200, products);
      return;
    }

    const productId = url.split("/products/")[1];
    const product = products.find((entry) => entry.product_id === productId);
    await fulfillJson(route, product ? 200 : 404, product || { detail: "Product not found" });
  });
  await page.route("**://localhost:8002/search_suppliers/**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("name")?.trim().toLowerCase() ?? "";
    const filtered = query ? suppliers.filter((supplier) => supplier.name.toLowerCase().includes(query)) : suppliers;
    await fulfillJson(route, 200, filtered);
  });
  await page.route("**://localhost:8002/suppliers/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/suppliers/" && method === "GET") {
      await fulfillJson(route, 200, suppliers);
      return;
    }

    if (path === "/suppliers/" && method === "POST") {
      await fulfillJson(route, 201, suppliers[0]);
      return;
    }

    if (path.endsWith("/documents") && method === "GET") {
      await fulfillJson(route, 200, sampleSupplierDocuments.filter((document) => document.supplier_id === path.split("/")[2]));
      return;
    }

    if (path.endsWith("/documents") && method === "POST") {
      await fulfillJson(route, 200, sampleSupplierDocuments[0]);
      return;
    }

    if (path.endsWith("/download") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.4 mock",
      });
      return;
    }

    if (path.includes("/documents/") && method === "DELETE") {
      await fulfillJson(route, 200, { message: "Document deleted" });
      return;
    }

    const supplierId = path.replace("/suppliers/", "").split("/")[0];
    const supplier = suppliers.find((entry) => entry.supplier_id === supplierId);

    if (method === "GET") {
      await fulfillJson(route, supplier ? 200 : 404, supplier || { detail: "Supplier not found" });
      return;
    }

    if (method === "PATCH") {
      await fulfillJson(route, 200, supplier || suppliers[0]);
      return;
    }

    if (method === "DELETE") {
      await fulfillJson(route, 200, { message: "Deleted" });
      return;
    }

    await fulfillJson(route, 200, suppliers);
  });
}

async function mockCatalogSession(
  page: Page,
  user: User,
  options?: {
    warehouses?: Warehouse[];
    suppliers?: Supplier[];
    warehouseProducts?: Record<string, WarehouseProduct[]>;
  },
) {
  const warehouses = options?.warehouses ?? sampleWarehouses;
  const suppliers = options?.suppliers ?? sampleSuppliers;
  const warehouseProducts = options?.warehouseProducts ?? sampleWarehouseProducts;
  const state = {
    requestLog: [] as string[],
  };
  let loggedOut = false;

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }

    await fulfillJson(route, 200, { user_id: user.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 200, user);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8002/warehouses/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/warehouses/" && route.request().method() === "GET") {
      state.requestLog.push(route.request().url());
      await fulfillJson(route, 200, warehouses);
      return;
    }

    await route.fallback();
  });
  await page.route("**://localhost:8002/suppliers/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/suppliers/" && method === "GET") {
      await fulfillJson(route, 200, suppliers);
      return;
    }

    const supplierId = path.replace("/suppliers/", "").split("/")[0];
    const supplier = suppliers.find((entry) => entry.supplier_id === supplierId);

    if (method === "GET") {
      await fulfillJson(route, supplier ? 200 : 404, supplier || { detail: "Supplier not found" });
      return;
    }

    await fulfillJson(route, 200, supplier || suppliers[0]);
  });
  await page.route("**://localhost:8002/productinwarehouses/**/products**", async (route) => {
    const url = new URL(route.request().url());
    const pathnameParts = url.pathname.split("/").filter(Boolean);
    const warehouseId = pathnameParts[1] || "";
    const query = url.searchParams;
    const baseProducts = warehouseProducts[warehouseId] ?? [];
    const filteredProducts = baseProducts.filter((product) => {
      const nameFilter = query.get("name")?.trim().toLowerCase() ?? "";
      const minPrice = query.get("min_price");
      const maxPrice = query.get("max_price");
      const inStock = query.get("in_stock");
      const numericPrice = Number(product.price);

      if (nameFilter && !product.name.toLowerCase().includes(nameFilter)) {
        return false;
      }
      if (minPrice !== null && minPrice !== "" && Number.isFinite(Number(minPrice)) && numericPrice < Number(minPrice)) {
        return false;
      }
      if (maxPrice !== null && maxPrice !== "" && Number.isFinite(Number(maxPrice)) && numericPrice > Number(maxPrice)) {
        return false;
      }
      if (inStock === "true" && product.stock_quantity <= 0) {
        return false;
      }
      return true;
    });

    state.requestLog.push(route.request().url());
    await fulfillJson(route, 200, filteredProducts);
  });

  return state;
}

async function mockWarehousesSession(
  page: Page,
  user: User,
  options?: {
    warehouses?: Warehouse[];
    products?: Product[];
    warehouseProducts?: Record<string, ProductWarehouseSeed[]>;
    warehousesLoadError?: string;
    warehouseDetailLoadError?: string;
    productsLoadError?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
    addProductError?: string;
    updateProductError?: string;
    deleteProductError?: string;
  },
) {
  const state = {
    requestLog: [] as string[],
    warehouses: [...(options?.warehouses ?? sampleWarehouses)],
    products: [...(options?.products ?? sampleWarehouseDetailProducts)],
    warehouseProducts: cloneWarehouseProducts(options?.warehouseProducts ?? sampleWarehouseProductEntries),
    nextWarehouseIndex: 1,
    nextProductWarehouseIndex: 1,
  };
  let loggedOut = false;

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }

    await fulfillJson(route, 200, { user_id: user.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 200, user);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8002/warehouses/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/warehouses/" && method === "GET") {
      state.requestLog.push("GET /warehouses/");
      if (options?.warehousesLoadError) {
        await fulfillJson(route, 500, { detail: options.warehousesLoadError });
        return;
      }

      await fulfillJson(route, 200, state.warehouses);
      return;
    }

    if (path === "/warehouses/" && method === "POST") {
      state.requestLog.push("POST /warehouses/");
      if (options?.createError) {
        await fulfillJson(route, 500, { detail: options.createError });
        return;
      }

      const body = route.request().postDataJSON() as Partial<Warehouse>;
      const createdWarehouse: Warehouse = {
        warehouse_id: `warehouse-new-${state.nextWarehouseIndex++}`,
        location: body.location || "New Warehouse",
        manager_name: body.manager_name ?? null,
        capacity: body.capacity ?? 1,
        current_stock: body.current_stock ?? 0,
        contact_number: body.contact_number ?? null,
        email: body.email ?? null,
        is_active: body.is_active ?? true,
        area_size: body.area_size ?? null,
      };
      state.warehouses = [createdWarehouse, ...state.warehouses];
      state.warehouseProducts[createdWarehouse.warehouse_id] = [];
      await fulfillJson(route, 201, createdWarehouse);
      return;
    }

    if (path.startsWith("/warehouses/") && path !== "/warehouses/") {
      const warehouseId = path.replace("/warehouses/", "");
      const warehouse = state.warehouses.find((entry) => entry.warehouse_id === warehouseId);

      if (method === "GET") {
        state.requestLog.push(`GET /warehouses/${warehouseId}`);
        if (options?.warehouseDetailLoadError) {
          await fulfillJson(route, 500, { detail: options.warehouseDetailLoadError });
          return;
        }
        await fulfillJson(route, warehouse ? 200 : 404, warehouse || { detail: "Warehouse not found" });
        return;
      }

      if (method === "PATCH") {
        state.requestLog.push(`PATCH /warehouses/${warehouseId}`);
        if (options?.updateError) {
          await fulfillJson(route, 500, { detail: options.updateError });
          return;
        }
        if (!warehouse) {
          await fulfillJson(route, 404, { detail: "Warehouse not found" });
          return;
        }

        const body = route.request().postDataJSON() as Partial<Warehouse>;
        const updatedWarehouse: Warehouse = {
          ...warehouse,
          location: body.location ?? warehouse.location,
          manager_name: body.manager_name ?? warehouse.manager_name,
          capacity: body.capacity ?? warehouse.capacity,
          current_stock: body.current_stock ?? warehouse.current_stock,
          contact_number: body.contact_number ?? warehouse.contact_number,
          email: body.email ?? warehouse.email,
          is_active: body.is_active ?? warehouse.is_active,
          area_size: body.area_size ?? warehouse.area_size,
        };
        state.warehouses = state.warehouses.map((entry) => (entry.warehouse_id === warehouseId ? updatedWarehouse : entry));
        await fulfillJson(route, 200, updatedWarehouse);
        return;
      }

      if (method === "DELETE") {
        state.requestLog.push(`DELETE /warehouses/${warehouseId}`);
        if (options?.deleteError) {
          await fulfillJson(route, 500, { detail: options.deleteError });
          return;
        }
        if (!warehouse) {
          await fulfillJson(route, 404, { detail: "Warehouse not found" });
          return;
        }

        if ((state.warehouseProducts[warehouseId] || []).length > 0) {
          await fulfillJson(route, 422, { detail: "Cannot delete warehouse: there are products linked to this warehouse." });
          return;
        }

        state.warehouses = state.warehouses.filter((entry) => entry.warehouse_id !== warehouseId);
        delete state.warehouseProducts[warehouseId];
        await fulfillJson(route, 200, { message: "Warehouse deleted" });
        return;
      }
    }

    await route.fallback();
  });
  await page.route("**://localhost:8002/productinwarehouses**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();
    const pathnameParts = path.split("/").filter(Boolean);

    if (path.startsWith("/productinwarehouses/") && path.endsWith("/products") && method === "GET") {
      const warehouseId = pathnameParts[1] || "";
      const query = url.searchParams;
      const baseProducts = state.warehouseProducts[warehouseId] ?? [];
      const filteredProducts = baseProducts.filter((product) => {
        const nameFilter = query.get("name")?.trim().toLowerCase() ?? "";
        const minPrice = query.get("min_price");
        const maxPrice = query.get("max_price");
        const inStock = query.get("in_stock");
        const productDetails = state.products.find((entry) => entry.product_id === product.product_id);
        const productName = productDetails?.name?.toLowerCase() ?? "";
        const numericPrice = Number(productDetails?.price ?? 0);

        if (nameFilter && !productName.includes(nameFilter)) {
          return false;
        }
        if (minPrice !== null && minPrice !== "" && Number.isFinite(Number(minPrice)) && numericPrice < Number(minPrice)) {
          return false;
        }
        if (maxPrice !== null && maxPrice !== "" && Number.isFinite(Number(maxPrice)) && numericPrice > Number(maxPrice)) {
          return false;
        }
        if (inStock === "true" && product.quantity <= 0) {
          return false;
        }
        return true;
      });

      state.requestLog.push(route.request().url());
      await fulfillJson(route, 200, filteredProducts);
      return;
    }

    if (path.startsWith("/productinwarehouses/") && method === "GET") {
      const warehouseId = pathnameParts[1] || "";
      state.requestLog.push(`GET /productinwarehouses/${warehouseId}`);
      if (options?.productsLoadError) {
        await fulfillJson(route, 500, { detail: options.productsLoadError });
        return;
      }
      await fulfillJson(route, 200, state.warehouseProducts[warehouseId] || []);
      return;
    }

    if (path === "/productinwarehouses" && method === "POST") {
      const warehouseId = url.searchParams.get("warehouse_id") || "";
      const productId = url.searchParams.get("product_id") || "";
      const quantity = Number(url.searchParams.get("quantity") || "0");
      state.requestLog.push(`POST /productinwarehouses?warehouse_id=${warehouseId}&product_id=${productId}&quantity=${quantity}`);

      if (options?.addProductError) {
        await fulfillJson(route, 500, { detail: options.addProductError });
        return;
      }

      const existingProduct = state.products.find((entry) => entry.product_id === productId);
      const warehouse = state.warehouses.find((entry) => entry.warehouse_id === warehouseId);
      if (!existingProduct || !warehouse) {
        await fulfillJson(route, 404, { detail: "Product not found" });
        return;
      }

      const createdRecord: ProductWarehouseSeed = {
        product_warehouse_id: `product-warehouse-new-${state.nextProductWarehouseIndex++}`,
        product_id: productId,
        warehouse_id: warehouseId,
        quantity,
      };
      state.warehouseProducts[warehouseId] = [...(state.warehouseProducts[warehouseId] || []), createdRecord];
      warehouse.current_stock += quantity;
      await fulfillJson(route, 200, createdRecord);
      return;
    }

    if (path.startsWith("/productinwarehouses/") && method === "PUT") {
      const productId = pathnameParts[1] || "";
      const productWarehouseId = url.searchParams.get("product_warehouse_id") || "";
      const quantity = Number(url.searchParams.get("quantity") || "0");
      state.requestLog.push(`PUT /productinwarehouses/${productId}?product_warehouse_id=${productWarehouseId}&quantity=${quantity}`);

      if (options?.updateProductError) {
        await fulfillJson(route, 500, { detail: options.updateProductError });
        return;
      }

      const nextEntry = findProductWarehouse(state.warehouseProducts, state.warehouses, productWarehouseId, productId);
      if (!nextEntry) {
        await fulfillJson(route, 404, { detail: "Product in warehouse not found" });
        return;
      }

      nextEntry.record.quantity = quantity;
      nextEntry.warehouse.current_stock = Math.max(nextEntry.warehouse.current_stock + (quantity - nextEntry.previousQuantity), 0);
      await fulfillJson(route, 200, nextEntry.record);
      return;
    }

    if (path.startsWith("/productinwarehouses/") && method === "DELETE") {
      const productId = pathnameParts[1] || "";
      const productWarehouseId = url.searchParams.get("product_warehouse_id") || "";
      state.requestLog.push(`DELETE /productinwarehouses/${productId}?product_warehouse_id=${productWarehouseId}`);

      if (options?.deleteProductError) {
        await fulfillJson(route, 500, { detail: options.deleteProductError });
        return;
      }

      const nextEntry = findProductWarehouse(state.warehouseProducts, state.warehouses, productWarehouseId, productId);
      if (!nextEntry) {
        await fulfillJson(route, 404, { detail: "Product in warehouse not found" });
        return;
      }

      nextEntry.warehouse.current_stock = Math.max(nextEntry.warehouse.current_stock - nextEntry.record.quantity, 0);
      state.warehouseProducts[nextEntry.record.warehouse_id] = (state.warehouseProducts[nextEntry.record.warehouse_id] || []).filter(
        (entry) => entry.product_warehouse_id !== productWarehouseId,
      );
      await fulfillJson(route, 200, { message: "Product removed from warehouse" });
      return;
    }

    await route.fallback();
  });
  await page.route("**://localhost:8002/products/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/products/" && route.request().method() === "GET") {
      await fulfillJson(route, 200, state.products);
      return;
    }

    if (path.startsWith("/products/") && route.request().method() === "GET") {
      const productId = path.replace("/products/", "");
      const product = state.products.find((entry) => entry.product_id === productId);
      state.requestLog.push(`GET /products/${productId}`);
      await fulfillJson(route, product ? 200 : 404, product || { detail: "Product not found" });
      return;
    }

    await route.fallback();
  });

  return state;
}

function cloneWarehouseProducts(source: Record<string, ProductWarehouseSeed[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([warehouseId, entries]) => [
      warehouseId,
      entries.map((entry) => ({ ...entry })),
    ]),
  ) as Record<string, ProductWarehouseSeed[]>;
}

function findProductWarehouse(
  warehouseProducts: Record<string, ProductWarehouseSeed[]>,
  warehouses: Warehouse[],
  productWarehouseId: string,
  productId: string,
) {
  for (const entries of Object.values(warehouseProducts)) {
    const record = entries.find(
      (entry) => entry.product_warehouse_id === productWarehouseId && entry.product_id === productId,
    );
    if (!record) {
      continue;
    }

    const warehouse = warehouses.find((entry) => entry.warehouse_id === record.warehouse_id);
    if (!warehouse) {
      return null;
    }

    return {
      record,
      warehouse,
      previousQuantity: record.quantity,
    };
  }

  return null;
}

async function mockShipmentsSession(
  page: Page,
  user: User,
  orders: ShipmentOrderSeed[],
  options?: {
    loadError?: string;
    cancelError?: string;
    downloadFailures?: Array<{ orderId: string; kind: "invoice" | "shipment" }>;
  },
) {
  const state = {
    orders: [...orders],
    requestLog: [] as string[],
    downloadRequests: [] as Array<{ url: string; authorization: string | null }>,
    downloadFailures: new Set(options?.downloadFailures?.map((entry) => `${entry.orderId}:${entry.kind}`) ?? []),
  };
  let loggedOut = false;

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }

    await fulfillJson(route, 200, { user_id: user.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 200, user);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8003/graphql", async (route) => {
    const body = route.request().postDataJSON() as {
      query?: string;
      variables?: { input?: { orderId?: string; status?: string } };
    };
    const query = body.query || "";

    if (query.includes("listAllOrders")) {
      state.requestLog.push("listAllOrders");
      if (options?.loadError) {
        await fulfillJson(route, 200, { errors: [{ message: options.loadError }] });
        return;
      }

      await fulfillJson(route, 200, { data: { listAllOrders: state.orders } });
      return;
    }

    if (query.includes("listOrders")) {
      state.requestLog.push("listOrders");
      if (options?.loadError) {
        await fulfillJson(route, 200, { errors: [{ message: options.loadError }] });
        return;
      }

      await fulfillJson(route, 200, { data: { listOrders: state.orders } });
      return;
    }

    if (query.includes("updateOrderStatus")) {
      const orderId = body.variables?.input?.orderId || "";
      const status = body.variables?.input?.status || "";
      state.requestLog.push(`updateOrderStatus:${orderId}:${status}`);

      if (options?.cancelError) {
        await fulfillJson(route, 200, { errors: [{ message: options.cancelError }] });
        return;
      }

      state.orders = state.orders.map((order) =>
        order.orderId === orderId
          ? {
              ...order,
              status: "cancelled" as const,
              updatedAt: new Date().toISOString(),
            }
          : order,
      );

      const updatedOrder = state.orders.find((order) => order.orderId === orderId) || null;
      await fulfillJson(route, 200, { data: { updateOrderStatus: updatedOrder } });
      return;
    }

    await route.fallback();
  });
  await page.route("**://localhost:8003/orders/**/documents/**", async (route) => {
    const url = new URL(route.request().url());
    const headers = route.request().headers();
    const authorization = headers.authorization || headers.Authorization || null;
    const pathnameParts = url.pathname.split("/").filter(Boolean);
    const orderId = pathnameParts[1] || "";
    const documentName = pathnameParts[3] || "";
    const kind = documentName.replace(".pdf", "");

    state.downloadRequests.push({
      url: url.toString(),
      authorization,
    });

    if (state.downloadFailures.has(`${orderId}:${kind}`)) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Download failed" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/pdf",
      body: "%PDF-1.4 mock",
    });
  });

  return state;
}

async function mockUserListSession(
  page: Page,
  user: User,
  options?: {
    users?: User[];
    loadError?: string;
  },
) {
  const state = {
    users: [...(options?.users ?? sampleUserListUsers)],
    requestLog: [] as string[],
  };
  let loggedOut = false;

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }

    await fulfillJson(route, 200, { user_id: user.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 200, user);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8001/users**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/users" && method === "GET") {
      state.requestLog.push(url.toString());
      if (options?.loadError) {
        await fulfillJson(route, 500, { detail: options.loadError });
        return;
      }

      const pageNumber = Number(url.searchParams.get("page") || "1");
      const pageSize = Number(url.searchParams.get("page_size") || "10");
      const sortBy = url.searchParams.get("sort_by") || "name";
      const order = url.searchParams.get("order") || "asc";
      const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
      const role = url.searchParams.get("role");

      const filtered = state.users.filter((entry) => {
        if (role && role !== "all" && entry.role !== role) {
          return false;
        }
        if (search && !`${entry.name} ${entry.email}`.toLowerCase().includes(search)) {
          return false;
        }
        return true;
      });

      const sorted = [...filtered].sort((left, right) => {
        const leftValue = String(left[sortBy as keyof User] ?? "");
        const rightValue = String(right[sortBy as keyof User] ?? "");
        const comparison = leftValue.localeCompare(rightValue, "ru");
        return order === "desc" ? -comparison : comparison;
      });

      const total = sorted.length;
      const totalPages = total ? Math.ceil(total / pageSize) : 0;
      const startIndex = (pageNumber - 1) * pageSize;
      const nextUsers = sorted.slice(startIndex, startIndex + pageSize);

      await fulfillJson(route, 200, {
        users: nextUsers,
        total,
        page: pageNumber,
        page_size: pageSize,
        total_pages: totalPages,
      });
      return;
    }

    if (path.startsWith("/users/") && path.endsWith("/role") && method === "PUT") {
      const userId = path.split("/")[2] || "";
      const body = route.request().postDataJSON() as { role?: UserRole };
      const nextRole = body.role || "customer";
      state.requestLog.push(`PUT /users/${userId}/role:${nextRole}`);

      const target = state.users.find((entry) => entry.id === userId);
      if (!target) {
        await fulfillJson(route, 404, { detail: "User not found" });
        return;
      }

      if (target.role === "admin" && nextRole !== "admin" && state.users.filter((entry) => entry.role === "admin").length <= 1) {
        await fulfillJson(route, 403, { detail: "Cannot remove the last admin role" });
        return;
      }

      state.users = state.users.map((entry) => (entry.id === userId ? { ...entry, role: nextRole } : entry));
      await fulfillJson(route, 200, { detail: "User role successfully updated", role: nextRole });
      return;
    }

    await route.fallback();
  });

  return state;
}

async function mockChatSession(
  page: Page,
  user: User,
  options?: {
    chats?: ChatSeed[];
    messagesByChatId?: Record<string, ChatMessageSeed[]>;
    users?: User[];
    chatsLoadError?: string;
    messagesLoadError?: string;
    createError?: string;
    addUserError?: string;
  },
) {
  const state = {
    requestLog: [] as string[],
    createBodies: [] as ChatCreatePayloadSeed[],
    addUserRequests: [] as Array<{ chatId: string; userId: string }>,
    chats: cloneChatSeeds(options?.chats ?? sampleChats),
    messagesByChatId: cloneChatMessages(options?.messagesByChatId ?? sampleChatMessages),
    users: [...(options?.users ?? sampleChatUsers)],
    nextChatIndex: 1,
  };
  let loggedOut = false;

  await installChatWebSocketMock(page);

  await page.route("**://localhost:8001/refresh-token", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 200, { user_id: null, access_token: null });
      return;
    }

    await fulfillJson(route, 200, { user_id: user.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    if (loggedOut) {
      await fulfillJson(route, 401, { detail: "Unauthorized" });
      return;
    }

    await fulfillJson(route, 200, user);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    loggedOut = true;
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8001/users**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/users" && method === "GET") {
      state.requestLog.push(url.toString());
      const pageNumber = Number(url.searchParams.get("page") || "1");
      const pageSize = Number(url.searchParams.get("page_size") || "100");
      const sortBy = url.searchParams.get("sort_by") || "name";
      const order = url.searchParams.get("order") || "asc";

      const sorted = [...state.users].sort((left, right) => {
        const leftValue = String(left[sortBy as keyof User] ?? "");
        const rightValue = String(right[sortBy as keyof User] ?? "");
        const comparison = leftValue.localeCompare(rightValue, "ru");
        return order === "desc" ? -comparison : comparison;
      });

      const total = sorted.length;
      const totalPages = total ? Math.ceil(total / pageSize) : 0;
      const startIndex = (pageNumber - 1) * pageSize;
      const nextUsers = sorted.slice(startIndex, startIndex + pageSize);

      await fulfillJson(route, 200, {
        users: nextUsers,
        total,
        page: pageNumber,
        page_size: pageSize,
        total_pages: totalPages,
      });
      return;
    }

    await route.fallback();
  });
  await page.route("**://localhost:8001/user_name/**", async (route) => {
    const userId = new URL(route.request().url()).pathname.split("/").pop() || "";
    const target = state.users.find((entry) => entry.id === userId);
    state.requestLog.push(`GET /user_name/${userId}`);

    if (!target) {
      await fulfillJson(route, 404, { detail: "User not found" });
      return;
    }

    await fulfillJson(route, 200, { name: target.name });
  });
  await page.route("**://localhost:8004/chats/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/chats/" && method === "GET") {
      state.requestLog.push("GET /chats/");
      if (options?.chatsLoadError) {
        await fulfillJson(route, 500, { detail: options.chatsLoadError });
        return;
      }

      await fulfillJson(route, 200, state.chats);
      return;
    }

    if (path === "/chats/" && method === "POST") {
      state.requestLog.push("POST /chats/");
      if (options?.createError) {
        await fulfillJson(route, 500, { detail: options.createError });
        return;
      }

      const body = route.request().postDataJSON() as Partial<ChatCreatePayloadSeed>;
      const participants = Array.from(new Set(body.participants ?? []));

      if (participants.length < 2) {
        await fulfillJson(route, 400, { detail: "A chat must have at least two participants" });
        return;
      }

      if (new Set(body.participants ?? []).size !== participants.length) {
        await fulfillJson(route, 400, { detail: "Participants must not contain duplicate user IDs." });
        return;
      }

      if (participants.length > 2 && body.is_group !== true) {
        await fulfillJson(route, 400, { detail: "Chat with more than two participants must be marked as a group chat (is_group=True)" });
        return;
      }

      if (!participants.includes(user.id)) {
        await fulfillJson(route, 400, { detail: "Current user must be a participant" });
        return;
      }

      const createdChat: ChatSeed = {
        id: `chat-new-${state.nextChatIndex++}`,
        name: body.name?.trim() || "Без названия",
        is_group: Boolean(body.is_group),
        created_at: new Date().toISOString(),
        participants,
      };
      state.chats = [createdChat, ...state.chats];
      state.messagesByChatId[createdChat.id] = [];
      state.createBodies.push({
        name: createdChat.name,
        is_group: createdChat.is_group,
        participants,
      });
      await fulfillJson(route, 201, createdChat);
      return;
    }

    if (path.startsWith("/chats/add_user") && method === "PATCH") {
      const chatId = url.searchParams.get("chat_id") || "";
      const userId = url.searchParams.get("user_id") || "";
      state.requestLog.push(`PATCH /chats/add_user?chat_id=${chatId}&user_id=${userId}`);
      state.addUserRequests.push({ chatId, userId });

      if (options?.addUserError) {
        await fulfillJson(route, 500, { detail: options.addUserError });
        return;
      }

      const chat = state.chats.find((entry) => entry.id === chatId);
      if (!chat) {
        await fulfillJson(route, 404, { detail: "Chat not found" });
        return;
      }

      chat.participants = Array.from(new Set([...chat.participants, userId]));
      await fulfillJson(route, 200, { message: "User added to chat successfully" });
      return;
    }

    if (path.startsWith("/chats/") && path.endsWith("/messages") && method === "GET") {
      const chatId = path.split("/")[2] || "";
      state.requestLog.push(`GET /chats/${chatId}/messages`);
      if (options?.messagesLoadError) {
        await fulfillJson(route, 500, { detail: options.messagesLoadError });
        return;
      }

      await fulfillJson(route, 200, state.messagesByChatId[chatId] || []);
      return;
    }

    if (path.startsWith("/chats/") && method === "GET") {
      const chatId = path.split("/")[2] || "";
      state.requestLog.push(`GET /chats/${chatId}`);
      const chat = state.chats.find((entry) => entry.id === chatId);
      if (!chat) {
        await fulfillJson(route, 404, { detail: "Chat not found" });
        return;
      }

      await fulfillJson(route, 200, chat);
      return;
    }

    await route.fallback();
  });

  return state;
}

async function installChatWebSocketMock(page: Page) {
  await page.addInitScript(() => {
    const sockets: Array<{
      url: string;
      readyState: number;
      sent: string[];
      onopen: ((event: Event) => void) | null;
      onmessage: ((event: MessageEvent<string>) => void) | null;
      onerror: ((event: Event) => void) | null;
      onclose: ((event: Event) => void) | null;
      send: (data: string) => void;
      close: () => void;
      emitMessage: (payload: unknown) => void;
      emitError: () => void;
    }> = [];

    class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;

      url: string;
      readyState: number;
      sent: string[];
      onopen: ((event: Event) => void) | null = null;
      onmessage: ((event: MessageEvent<string>) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      onclose: ((event: Event) => void) | null = null;

      constructor(url: string) {
        this.url = String(url);
        this.readyState = MockWebSocket.CONNECTING;
        this.sent = [];
        sockets.push(this as never);

        setTimeout(() => {
          if (this.readyState !== MockWebSocket.CONNECTING) {
            return;
          }

          this.readyState = MockWebSocket.OPEN;
          this.onopen?.(new Event("open"));
        }, 0);
      }

      send(data: string) {
        const payload = typeof data === "string" ? data : String(data);
        this.sent.push(payload);

        const match = this.url.match(/\/ws\/([^/]+)\/([^?]+)/);
        const chatId = match?.[1] || "";
        const userId = match?.[2] || "";

        setTimeout(() => {
          if (this.readyState !== MockWebSocket.OPEN) {
            return;
          }

          this.onmessage?.(
            new MessageEvent("message", {
              data: JSON.stringify({
                id: `mock-${this.sent.length}`,
                chat_id: chatId,
                sender_id: userId,
                content: JSON.parse(payload).content,
                created_at: new Date().toISOString(),
              }),
            }),
          );
        }, 0);
      }

      close() {
        if (this.readyState === MockWebSocket.CLOSED) {
          return;
        }

        this.readyState = MockWebSocket.CLOSED;
        this.onclose?.(new Event("close"));
      }

      emitMessage(payload: unknown) {
        if (this.readyState === MockWebSocket.CLOSED) {
          return;
        }

        this.onmessage?.(
          new MessageEvent("message", {
            data: typeof payload === "string" ? payload : JSON.stringify(payload),
          }),
        );
      }

      emitError() {
        if (this.readyState === MockWebSocket.CLOSED) {
          return;
        }

        this.onerror?.(new Event("error"));
      }
    }

    (window as any).__mockChatWebSockets = sockets;
    (window as any).WebSocket = MockWebSocket;
  });
}

async function getChatWebSocketSnapshot(page: Page) {
  return page.evaluate(() => {
    const sockets = (window as any).__mockChatWebSockets || [];
    return sockets.map((socket: { url: string; readyState: number; sent: string[] }) => ({
      url: socket.url,
      readyState: socket.readyState,
      sent: [...socket.sent],
    }));
  });
}

async function emitChatWebSocketMessage(page: Page, index: number, payload: unknown) {
  await page.evaluate(
    ({ index: socketIndex, message }) => {
      const sockets = (window as any).__mockChatWebSockets || [];
      sockets[socketIndex]?.emitMessage?.(message);
    },
    { index, message: payload },
  );
}

async function emitChatWebSocketError(page: Page, index: number) {
  await page.evaluate(
    ({ index: socketIndex }) => {
      const sockets = (window as any).__mockChatWebSockets || [];
      sockets[socketIndex]?.emitError?.();
    },
    { index },
  );
}

function cloneChatSeeds(source: ChatSeed[]) {
  return source.map((chat) => ({
    ...chat,
    participants: [...chat.participants],
  }));
}

function cloneChatMessages(source: Record<string, ChatMessageSeed[]>) {
  return Object.fromEntries(
    Object.entries(source).map(([chatId, messages]) => [
      chatId,
      messages.map((message) => ({ ...message })),
    ]),
  ) as Record<string, ChatMessageSeed[]>;
}

async function mockCartSession(page: Page, user: User, cartItems: CartItemSeed[] = []) {
  await mockCatalogSession(page, user);
  await page.addInitScript((items) => {
    window.localStorage.setItem("cart", JSON.stringify(items));
  }, cartItems);
}

async function mockCustomerSession(page: Page, products: Product[], suppliers: Supplier[]) {
  await page.route("**://localhost:8001/refresh-token", async (route) => {
    await fulfillJson(route, 200, { user_id: customerUser.id, access_token: "test-access-token" });
  });
  await page.route("**://localhost:8001/me", async (route) => {
    await fulfillJson(route, 200, customerUser);
  });
  await page.route("**://localhost:8001/logout", async (route) => {
    await fulfillJson(route, 200, { detail: "Logged out" });
  });
  await page.route("**://localhost:8002/products/**", async (route) => {
    const url = route.request().url();

    if (url.endsWith("/products/")) {
      await fulfillJson(route, 200, products);
      return;
    }

    const productId = url.split("/products/")[1];
    const product = products.find((entry) => entry.product_id === productId);
    await fulfillJson(route, product ? 200 : 404, product || { detail: "Product not found" });
  });
  await page.route("**://localhost:8002/search_suppliers/**", async (route) => {
    const query = new URL(route.request().url()).searchParams.get("name")?.trim().toLowerCase() ?? "";
    const filtered = query ? suppliers.filter((supplier) => supplier.name.toLowerCase().includes(query)) : suppliers;
    await fulfillJson(route, 200, filtered);
  });
  await page.route("**://localhost:8002/suppliers/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (path === "/suppliers/" && method === "GET") {
      await fulfillJson(route, 200, suppliers);
      return;
    }

    if (path.endsWith("/documents") && method === "GET") {
      await fulfillJson(route, 200, sampleSupplierDocuments.filter((document) => document.supplier_id === path.split("/")[2]));
      return;
    }

    if (path.endsWith("/download") && method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "%PDF-1.4 mock",
      });
      return;
    }

    const supplierId = path.replace("/suppliers/", "").split("/")[0];
    const supplier = suppliers.find((entry) => entry.supplier_id === supplierId);

    if (method === "GET") {
      await fulfillJson(route, supplier ? 200 : 404, supplier || { detail: "Supplier not found" });
      return;
    }

    if (method === "DELETE") {
      await fulfillJson(route, 200, { message: "Deleted" });
      return;
    }

    await fulfillJson(route, 200, suppliers);
  });
}

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}
