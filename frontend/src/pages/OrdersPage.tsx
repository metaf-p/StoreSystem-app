import { type ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Search, ShoppingCart } from "lucide-react";
import { listWarehouseProducts, listWarehouses } from "../api/catalog";
import { listSuppliers } from "../api/products";
import { getErrorMessage } from "../lib/http";
import { getCartCount, loadCart, saveCart, upsertCartItem } from "../lib/cart";
import type { CartItem, ProductFilter, Supplier, Warehouse, WarehouseProduct } from "../types";
import { useAuth } from "../state/AuthContext";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Input } from "../ui/Input";
import { RoleGuard } from "../ui/RoleGuard";
import { Select } from "../ui/Select";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";
import { resolveProductImageUrl } from "../lib/product-image";

type WarehouseFilterState = {
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
};

const DEFAULT_FILTERS: WarehouseFilterState = {
  minPrice: "0",
  maxPrice: "10000",
  inStock: false,
};

const actionLinkBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const actionLinkVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary:
    "border border-white/20 bg-white/10 text-white shadow-sm hover:bg-white/15 hover:text-white",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
};

export function OrdersPage() {
  const { authorizedFetch } = useAuth();
  const toast = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<WarehouseProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<WarehouseFilterState>(DEFAULT_FILTERS);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [warehousesError, setWarehousesError] = useState("");
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const productsRequestId = useRef(0);

  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.supplier_id, supplier.name])),
    [suppliers],
  );

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.warehouse_id === selectedWarehouseId) || null,
    [selectedWarehouseId, warehouses],
  );

  const cartCount = useMemo(() => getCartCount(cart), [cart]);

  const loadWarehouseList = useCallback(async () => {
    setWarehousesLoading(true);
    setWarehousesError("");

    try {
      setWarehouses(await listWarehouses(authorizedFetch));
    } catch (error) {
      const message = getErrorMessage(error);
      setWarehousesError(message);
      toast.danger(message);
    } finally {
      setWarehousesLoading(false);
    }
  }, [authorizedFetch, toast]);

  const loadSupplierList = useCallback(async () => {
    try {
      setSuppliers(await listSuppliers(authorizedFetch));
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  }, [authorizedFetch, toast]);

  const loadWarehouseProducts = useCallback(
    async (warehouseId: string, query?: ProductFilter) => {
      const requestId = ++productsRequestId.current;
      setProductsLoading(true);
      setProductsError("");

      try {
        const nextProducts = await listWarehouseProducts(authorizedFetch, warehouseId, query);
        if (productsRequestId.current !== requestId) {
          return;
        }
        setProducts(nextProducts);
      } catch (error) {
        if (productsRequestId.current !== requestId) {
          return;
        }
        const message = getErrorMessage(error);
        setProducts([]);
        setProductsError(message);
        toast.danger(message);
      } finally {
        if (productsRequestId.current === requestId) {
          setProductsLoading(false);
        }
      }
    },
    [authorizedFetch, toast],
  );

  useEffect(() => {
    void loadWarehouseList();
    void loadSupplierList();
  }, [loadSupplierList, loadWarehouseList]);

  useEffect(() => {
    const syncCartFromStorage = () => setCart(loadCart());
    window.addEventListener("storage", syncCartFromStorage);
    return () => window.removeEventListener("storage", syncCartFromStorage);
  }, []);

  const onWarehouseChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const nextWarehouseId = event.target.value;
    setSelectedWarehouseId(nextWarehouseId);
    setProducts([]);
    setProductsError("");

    if (!nextWarehouseId) {
      return;
    }

    await loadWarehouseProducts(nextWarehouseId);
  };

  const onSearchSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedWarehouseId) {
      toast.info("Выберите склад, чтобы искать товары.");
      return;
    }

    const query = searchQuery.trim();
    setFilters({ ...DEFAULT_FILTERS });

    if (!query) {
      await loadWarehouseProducts(selectedWarehouseId);
      return;
    }

    await loadWarehouseProducts(selectedWarehouseId, { name: query });
  };

  const onApplyFilters = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedWarehouseId) {
      toast.info("Выберите склад, чтобы применить фильтры.");
      return;
    }

    const query = searchQuery.trim();
    await loadWarehouseProducts(selectedWarehouseId, {
      min_price: parseWarehousePrice(filters.minPrice, 0),
      max_price: parseWarehousePrice(filters.maxPrice, 10000),
      in_stock: filters.inStock,
      ...(query ? { name: query } : {}),
    });
  };

  const onAddToCart = (product: WarehouseProduct) => {
    if (!selectedWarehouseId) {
      toast.info("Выберите склад, чтобы добавить товар в корзину.");
      return;
    }

    const result = upsertCartItem(cart, product, selectedWarehouseId);
    if (result.capped) {
      toast.danger("Достигнуто максимальное количество на складе");
      return;
    }

    setCart(result.nextCart);
    saveCart(result.nextCart);
    toast.success("Товар добавлен в корзину");
  };

  const updateMinPrice = (value: string) => {
    setFilters((current) => {
      if (value.trim() === "") {
        return { ...current, minPrice: "" };
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return current;
      }

      const maxValue = parseWarehousePrice(current.maxPrice, 10000);
      return { ...current, minPrice: String(Math.min(Math.max(parsed, 0), maxValue)) };
    });
  };

  const updateMaxPrice = (value: string) => {
    setFilters((current) => {
      if (value.trim() === "") {
        return { ...current, maxPrice: "" };
      }

      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        return current;
      }

      const minValue = parseWarehousePrice(current.minPrice, 0);
      return { ...current, maxPrice: String(Math.max(Math.min(parsed, 10000), minValue)) };
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Package className="h-3.5 w-3.5" />
              Каталог заказов
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Каталог товаров</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Выберите склад, применяйте фильтры и собирайте корзину. Данные сохраняются в
                <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-slate-50">localStorage.cart</code>
                и остаются совместимыми со старой страницей <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-50">/cart</code>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/cart" className={cn(actionLinkBase, actionLinkVariants.primary)}>
              <ShoppingCart className="h-4 w-4" />
              Корзина ({cartCount})
            </Link>
            <Link to="/shipments" className={cn(actionLinkBase, actionLinkVariants.secondary)}>
              Мои отгрузки
            </Link>
            <RoleGuard minRole="operator">
              <Link to="/admin-orders" className={cn(actionLinkBase, actionLinkVariants.warning)}>
                Админка заказов
              </Link>
            </RoleGuard>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card/95 p-5 shadow-lg shadow-slate-900/5">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Выбор склада</p>
              <h2 className="text-xl font-semibold tracking-tight">Найдите нужный склад</h2>
            </div>
            <Select
              name="warehouse"
              label="Склад"
              value={selectedWarehouseId}
              onChange={onWarehouseChange}
              disabled={warehousesLoading || warehouses.length === 0}
              wrapperClassName="space-y-2"
            >
              <option value="" disabled>
                {warehousesLoading ? "Загрузка складов..." : "Выберите склад"}
              </option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                  {warehouse.location}
                </option>
              ))}
            </Select>
            {warehousesError ? <p className="text-sm text-destructive">{warehousesError}</p> : null}
            {!warehousesLoading && !warehousesError && warehouses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Склады не найдены.</p>
            ) : null}
            {selectedWarehouse ? (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-foreground">
                <div className="font-medium text-primary">Выбран склад</div>
                <div className="mt-1 text-muted-foreground">{selectedWarehouse.location}</div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                Товары не загружаются, пока склад не выбран.
              </div>
            )}
          </div>

          <form className="space-y-4 border-t border-border pt-6" onSubmit={onSearchSubmit}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Поиск</p>
              <h2 className="text-xl font-semibold tracking-tight">Название товара</h2>
            </div>
            <Input
              label="Поиск по названию"
              name="product-search"
              placeholder="Например, ноутбук"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button type="submit" variant="outline-primary" fullWidth>
              <Search className="h-4 w-4" />
              Найти
            </Button>
          </form>

          <form className="space-y-4 border-t border-border pt-6" onSubmit={onApplyFilters}>
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary">Фильтры</p>
              <h2 className="text-xl font-semibold tracking-tight">Цена и наличие</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                name="min-price"
                label="Минимальная цена"
                min={0}
                max={10000}
                step={1}
                value={filters.minPrice}
                onChange={(event) => updateMinPrice(event.target.value)}
              />
              <Input
                type="number"
                name="max-price"
                label="Максимальная цена"
                min={0}
                max={10000}
                step={1}
                value={filters.maxPrice}
                onChange={(event) => updateMaxPrice(event.target.value)}
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-sm">
              <Checkbox
                name="in-stock-only"
                checked={filters.inStock}
                onCheckedChange={(checked) => setFilters((current) => ({ ...current, inStock: checked === true }))}
              />
              <span>Только в наличии</span>
            </label>

            <Button type="submit" fullWidth>
              Применить
            </Button>
          </form>
        </aside>

        <div className="rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Товары склада</p>
              <h2 className="text-xl font-semibold tracking-tight">
                {selectedWarehouse ? selectedWarehouse.location : "Выберите склад"}
              </h2>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedWarehouse ? `${products.length} ${products.length === 1 ? "товар" : "товаров"}` : "Каталог пока не загружен"}
            </div>
          </div>

          <div className="p-5">
            {!selectedWarehouseId ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-lg font-semibold tracking-tight">Выберите склад, чтобы увидеть товары</p>
                  <p className="text-sm text-muted-foreground">
                    После выбора склада появится список товаров и можно будет применить поиск или фильтры.
                  </p>
                </div>
              </div>
            ) : productsLoading ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <div className="inline-flex items-center gap-3 text-sm text-muted-foreground" role="status">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  Загрузка товаров...
                </div>
              </div>
            ) : productsError ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
                <p className="text-sm text-destructive">{productsError}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                <div className="max-w-md space-y-2">
                  <p className="text-lg font-semibold tracking-tight">Товары не найдены</p>
                  <p className="text-sm text-muted-foreground">
                    Попробуйте изменить склад, поиск или фильтры, чтобы расширить список.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {products.map((product) => {
                  const supplierName = supplierNameById.get(product.supplier_id) || "Неизвестен";
                  const imageSrc = resolveProductImageUrl(product.image_url);
                  const formattedPrice = formatMoney(product.price);

                  return (
                    <article
                      key={product.product_id}
                      className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="grid h-full gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
                        <div className="relative min-h-52 bg-muted">
                          <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>

                        <div className="flex min-h-full flex-col gap-4 p-5">
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.description || "Нет описания"}
                            </p>
                          </div>

                          <div className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-muted/40 px-3 py-2">
                              <span className="block text-xs uppercase tracking-wide text-muted-foreground">Поставщик</span>
                              <span className="font-medium">{supplierName}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 px-3 py-2">
                              <span className="block text-xs uppercase tracking-wide text-muted-foreground">Цена</span>
                              <span className="font-medium">{formattedPrice} ₽</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 px-3 py-2">
                              <span className="block text-xs uppercase tracking-wide text-muted-foreground">На складе</span>
                              <span className="font-medium">{product.stock_quantity}</span>
                            </div>
                            <div className="rounded-xl bg-muted/40 px-3 py-2">
                              <span className="block text-xs uppercase tracking-wide text-muted-foreground">Склад</span>
                              <span className="font-medium">{selectedWarehouse?.location || "—"}</span>
                            </div>
                          </div>

                          <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                              {product.stock_quantity > 0 ? "Доступно к добавлению" : "Нет в наличии"}
                            </p>
                            <Button
                              type="button"
                              variant={product.stock_quantity > 0 ? "primary" : "outline-secondary"}
                              disabled={product.stock_quantity <= 0}
                              className="sm:w-auto"
                              onClick={() => onAddToCart(product)}
                            >
                              {product.stock_quantity > 0 ? "Добавить в корзину" : "Нет в наличии"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function parseWarehousePrice(value: string, fallback: number) {
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatMoney(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  return numericValue.toFixed(2);
}
