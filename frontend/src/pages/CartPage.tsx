import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Receipt, ShoppingCart, Trash2 } from "lucide-react";
import { checkoutCart } from "../api/orders";
import { getErrorMessage } from "../lib/http";
import {
  changeCartItemQuantity,
  clearCart,
  getCartCount,
  getCartTotal,
  loadCart,
  removeCartItem,
  saveCart,
} from "../lib/cart";
import { resolveProductImageUrl } from "../lib/product-image";
import type { CartItem } from "../types";
import { useAuth } from "../state/AuthContext";
import { Button } from "../ui/Button";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";

const heroLinkBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const heroLinkVariants = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
};

export function CartPage() {
  const { authorizedFetch } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = useMemo(() => getCartTotal(cart), [cart]);
  const cartCount = useMemo(() => getCartCount(cart), [cart]);
  const isEmpty = cart.length === 0;

  useEffect(() => {
    const syncCartFromStorage = () => setCart(loadCart());
    window.addEventListener("storage", syncCartFromStorage);
    return () => window.removeEventListener("storage", syncCartFromStorage);
  }, []);

  const commitCart = (nextCart: CartItem[]) => {
    setCart(nextCart);
    saveCart(nextCart);
  };

  const onChangeQuantity = (item: CartItem, delta: number) => {
    const result = changeCartItemQuantity(cart, item, delta);
    if (result.capped) {
      toast.danger("Достигнуто максимальное количество на складе");
      return;
    }

    commitCart(result.nextCart);
  };

  const onRemoveItem = (item: CartItem) => {
    commitCart(removeCartItem(cart, item));
  };

  const onCheckout = async () => {
    if (isEmpty || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await checkoutCart(authorizedFetch, cart);
      clearCart();
      setCart([]);
      toast.success("Заказ успешно оформлен");
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <ShoppingCart className="h-3.5 w-3.5" />
              Корзина
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Оформление заказа</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Изменяйте количество, удаляйте позиции и отправляйте заказ в существующий GraphQL
                backend. Товары остаются совместимыми со старой <code className="rounded bg-white/10 px-1.5 py-0.5 text-slate-50">localStorage.cart</code>.
              </p>
            </div>
          </div>

          <Link to="/orders" className={cn(heroLinkBase, heroLinkVariants.secondary)}>
            <ArrowLeft className="h-4 w-4" />
            Вернуться к каталогу
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {isEmpty ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/95 px-6 py-10 text-center shadow-lg shadow-slate-900/5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Receipt className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">Корзина пуста</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Добавьте товары из каталога, чтобы увидеть позиции, изменить количество и оформить заказ.
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const imageSrc = resolveProductImageUrl(item.image_url);
              const numericPrice = Number(item.price);
              const lineTotal = Number.isFinite(numericPrice) ? numericPrice * item.quantity : 0;

              return (
                <article
                  key={`${item.product_id}-${item.warehouse_id}`}
                  className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5"
                >
                  <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="relative min-h-52 bg-muted">
                      <img src={imageSrc} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>

                    <div className="flex min-h-full flex-col gap-4 p-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h2 className="text-lg font-semibold tracking-tight">{item.name}</h2>
                          <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {formatMoney(item.price)} ₽
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Позиция из корзины, сохраненная в <code className="rounded bg-muted px-1.5 py-0.5 text-xs">localStorage.cart</code>.
                        </p>
                      </div>

                      <div className="grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">Количество</span>
                          <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">В наличии</span>
                          <span className="font-medium">{item.max_quantity}</span>
                        </div>
                        <div className="rounded-xl bg-muted/40 px-3 py-2">
                          <span className="block text-xs uppercase tracking-wide text-muted-foreground">Сумма строки</span>
                          <span className="font-medium">{formatMoney(lineTotal)} ₽</span>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            className="h-9 w-9 px-0"
                            disabled={isSubmitting}
                            onClick={() => onChangeQuantity(item, -1)}
                          >
                            -
                          </Button>
                          <span className="min-w-10 text-center text-base font-semibold">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline-primary"
                            size="sm"
                            className="h-9 w-9 px-0"
                            disabled={isSubmitting}
                            onClick={() => onChangeQuantity(item, 1)}
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => onRemoveItem(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border border-border bg-card/95 p-5 shadow-lg shadow-slate-900/5 lg:sticky lg:top-24">
          <div className="space-y-1">
            <p className="text-sm font-medium text-primary">Итоги</p>
            <h2 className="text-xl font-semibold tracking-tight">Сводка заказа</h2>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-background p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Позиций</span>
              <span className="font-medium">{cart.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Товаров</span>
              <span className="font-medium">{cartCount}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">Итого</span>
              <span className="text-lg font-semibold">{formatMoney(total)} ₽</span>
            </div>
          </div>

          <Button type="button" fullWidth disabled={isEmpty || isSubmitting} onClick={onCheckout}>
            {isSubmitting ? "Оформление..." : "Оформить заказ"}
          </Button>

          <p className="text-xs leading-5 text-muted-foreground">
            Заказ отправляется в GraphQL backend без изменения текущих контрактов. После успешного оформления корзина очищается.
          </p>
        </aside>
      </section>
    </div>
  );
}

function formatMoney(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return String(value);
  }
  return numericValue.toFixed(2);
}
