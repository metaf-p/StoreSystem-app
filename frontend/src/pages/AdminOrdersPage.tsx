import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CircleX, FileDown, Filter, Package2, RotateCcw, Search } from "lucide-react";
import { cancelOrder, downloadOrderDocument, listAllOrders, type OrderDocumentKind } from "../api/orders";
import { getErrorMessage } from "../lib/http";
import { useAuth } from "../state/AuthContext";
import type { AdminOrder, OrderStatus } from "../types";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";

type OrderStatusMeta = {
  label: string;
  badgeClassName: string;
};

const STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending: {
    label: "pending",
    badgeClassName: "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
  },
  completed: {
    label: "completed",
    badgeClassName: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
  },
  cancelled: {
    label: "cancelled",
    badgeClassName: "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20",
  },
};

type FilterStatus = "all" | OrderStatus;

export function AdminOrdersPage() {
  const { accessToken, authorizedFetch, refreshAccessToken } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [statusDraft, setStatusDraft] = useState<FilterStatus>("all");
  const [dateDraft, setDateDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [dateFilter, setDateFilter] = useState("");
  const [cancelCandidate, setCancelCandidate] = useState<AdminOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAllOrders = useCallback(async () => {
    setLoading(true);
    setTableError("");

    try {
      const nextOrders = await listAllOrders(authorizedFetch);
      setOrders(nextOrders);
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      setOrders([]);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, toast]);

  useEffect(() => {
    void loadAllOrders();
  }, [loadAllOrders]);

  const filteredOrders = useMemo(() => {
    const nextOrders = orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (dateFilter && !order.createdAt.startsWith(dateFilter)) {
        return false;
      }

      return true;
    });

    return nextOrders;
  }, [dateFilter, orders, statusFilter]);

  const handleApplyFilters = (event?: FormEvent) => {
    event?.preventDefault();
    setStatusFilter(statusDraft);
    setDateFilter(dateDraft);
  };

  const handleResetFilters = () => {
    setStatusDraft("all");
    setDateDraft("");
    setStatusFilter("all");
    setDateFilter("");
  };

  const handleCancelOrder = async () => {
    if (!cancelCandidate) {
      return;
    }

    setSubmitting(true);
    try {
      await cancelOrder(authorizedFetch, cancelCandidate.orderId);
      toast.success("Заказ успешно отменен");
      await loadAllOrders();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setSubmitting(false);
      setCancelCandidate(null);
    }
  };

  const handleDownloadDocument = async (orderId: string, kind: OrderDocumentKind) => {
    try {
      const token = accessToken || (await refreshAccessToken());
      if (!token) {
        throw new Error("Unauthorized");
      }

      await downloadOrderDocument(token, orderId, kind);
    } catch {
      toast.danger("Ошибка при скачивании документа.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Package2 className="h-3.5 w-3.5" />
              Администрирование заказов
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Администрирование заказов</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Все заказы системы с фильтрами по статусу и дате, отменой pending-заказов и скачиванием PDF-документов.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
            <Filter className="h-4 w-4" />
            {filteredOrders.length} {filteredOrders.length === 1 ? "заказ" : "заказов"}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight">Фильтры</h2>
        </div>

        <form className="grid gap-3 border-b border-border px-6 py-5 lg:grid-cols-[220px_220px_auto_auto] lg:items-end" onSubmit={handleApplyFilters}>
          <Select
            name="status-filter"
            label="Фильтр статуса"
            value={statusDraft}
            onChange={(event) => setStatusDraft(event.target.value as FilterStatus)}
            wrapperClassName="mb-0"
          >
            <option value="all">Все статусы</option>
            <option value="pending">pending</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </Select>

          <Input
            type="date"
            name="created-at"
            label="Дата создания"
            value={dateDraft}
            onChange={(event) => setDateDraft(event.target.value)}
            wrapperClassName="mb-0"
          />

          <Button type="submit" variant="outline-primary" className="justify-center">
            <Search className="h-4 w-4" />
            Применить
          </Button>

          <Button type="button" variant="outline-secondary" className="justify-center" onClick={handleResetFilters}>
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
        </form>
      </section>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/95 px-6 py-10 text-center shadow-lg shadow-slate-900/5">
          <div className="inline-flex items-center gap-3 text-sm text-muted-foreground" role="status">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            Загрузка заказов...
          </div>
        </div>
      ) : tableError ? (
        <div className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-6 py-10 text-center text-sm text-destructive shadow-lg shadow-slate-900/5">
          {tableError}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/95 px-6 py-10 text-center shadow-lg shadow-slate-900/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package2 className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">Заказы не найдены</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Попробуйте изменить статус или дату создания, чтобы найти нужный заказ.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredOrders.map((order) => {
            const total = getOrderTotal(order);
            const statusMeta = STATUS_META[order.status];
            const formattedDate = formatOrderDate(order.createdAt);
            const canShowCancel = order.status === "pending";

            return (
              <article
                key={order.orderId}
                data-testid="admin-order-card"
                className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5"
              >
                <div className="border-b border-border px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold tracking-tight">Заказ №{order.orderId}</h2>
                      <p className="text-sm text-muted-foreground">Пользователь: {order.userId || "—"}</p>
                      <p className="text-sm text-muted-foreground">Создан {formattedDate}</p>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
                        statusMeta.badgeClassName,
                      )}
                    >
                      {statusMeta.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-5 px-5 py-5 sm:px-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Состав заказа</h3>
                    <div className="grid gap-3">
                      {order.orderItems.map((item) => {
                        const itemPrice = normalizeMoney(item.priceAtOrder);
                        const lineTotal = itemPrice * item.quantity;

                        return (
                          <div
                            key={`${order.orderId}-${item.productId}-${item.warehouseId}`}
                            className="rounded-2xl border border-border bg-background/80 px-4 py-3"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="space-y-1">
                                <div className="font-medium text-foreground">Товар {item.productId}</div>
                                <div className="text-sm text-muted-foreground">Количество: {item.quantity}</div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Цена: {formatMoney(itemPrice)} ₽</div>
                                <div className="text-base font-semibold">{formatMoney(lineTotal)} ₽</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 border-t border-border pt-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-primary">Сумма заказа</p>
                      <p className="text-2xl font-semibold tracking-tight">{formatMoney(total)} ₽</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        className="sm:w-auto"
                        disabled={submitting}
                        onClick={() => handleDownloadDocument(order.orderId, "invoice")}
                      >
                        <FileDown className="h-4 w-4" />
                        Скачать счёт
                      </Button>
                      <Button
                        type="button"
                        variant="outline-primary"
                        size="sm"
                        className="sm:w-auto"
                        disabled={submitting}
                        onClick={() => handleDownloadDocument(order.orderId, "shipment")}
                      >
                        <FileDown className="h-4 w-4" />
                        Скачать отгрузочный документ
                      </Button>
                      {canShowCancel ? (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          className="sm:w-auto"
                          disabled={submitting}
                          onClick={() => setCancelCandidate(order)}
                        >
                          <CircleX className="h-4 w-4" />
                          Отменить заказ
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {cancelCandidate ? (
        <ConfirmDialog
          title="Отменить заказ?"
          onCancel={() => {
            if (!submitting) {
              setCancelCandidate(null);
            }
          }}
          onConfirm={handleCancelOrder}
          confirmLabel="Отменить"
          confirmVariant="danger"
          confirming={submitting}
        >
          Заказ <strong>№{cancelCandidate.orderId}</strong> будет переведен в статус cancelled.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function formatOrderDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

function normalizeMoney(value: string | number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function getOrderTotal(order: AdminOrder) {
  return order.orderItems.reduce((sum, item) => sum + normalizeMoney(item.priceAtOrder) * item.quantity, 0);
}
