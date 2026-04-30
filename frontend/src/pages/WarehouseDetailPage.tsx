import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Package, PencilLine, Plus, Trash2 } from "lucide-react";
import { getProduct } from "../api/products";
import {
  addProductToWarehouse,
  deleteProductFromWarehouse,
  getWarehouse,
  listProductsInWarehouse,
  updateProductInWarehouse,
} from "../api/warehouses";
import { getErrorMessage } from "../lib/http";
import { collectErrors, hasErrors, nonNegativeInteger, required } from "../lib/validation";
import { useAuth } from "../state/AuthContext";
import type { Warehouse, WarehouseProductRow } from "../types";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { RoleGuard } from "../ui/RoleGuard";
import { TableState } from "../ui/TableState";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";

type ProductWarehouseFormState = {
  productWarehouseId?: string;
  productId: string;
  quantity: string;
};

type ProductWarehouseFormErrors = Partial<Record<"productId" | "quantity", string>>;

const emptyProductWarehouseForm: ProductWarehouseFormState = {
  productId: "",
  quantity: "1",
};

const actionLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const heroActionLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function WarehouseDetailPage() {
  const { warehouseId } = useParams<{ warehouseId: string }>();
  const { authorizedFetch } = useAuth();
  const toast = useToast();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [products, setProducts] = useState<WarehouseProductRow[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [warehouseError, setWarehouseError] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<ProductWarehouseFormState>(emptyProductWarehouseForm);
  const [formErrors, setFormErrors] = useState<ProductWarehouseFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<WarehouseProductRow | null>(null);

  const loadProductRows = useCallback(
    async (id: string) => {
      const productEntries = await listProductsInWarehouse(authorizedFetch, id);
      const rows = await Promise.all(
        productEntries.map(async (entry) => {
          const product = await getProduct(authorizedFetch, entry.product_id);
          return {
            ...product,
            product_warehouse_id: entry.product_warehouse_id,
            quantity: entry.quantity,
          };
        }),
      );

      return rows;
    },
    [authorizedFetch],
  );

  const loadPage = useCallback(async () => {
    const id = warehouseId?.trim() || "";
    if (!id) {
      setWarehouse(null);
      setProducts([]);
      setWarehouseError("Идентификатор склада не найден.");
      setWarehouseLoading(false);
      setProductsLoading(false);
      return;
    }

    setWarehouseLoading(true);
    setProductsLoading(true);
    setWarehouseError("");
    setProductsError("");

    try {
      const nextWarehouse = await getWarehouse(authorizedFetch, id);
      setWarehouse(nextWarehouse);
    } catch (error) {
      const message = getErrorMessage(error);
      setWarehouse(null);
      setProducts([]);
      setWarehouseError(message);
      toast.danger(message);
      setWarehouseLoading(false);
      setProductsLoading(false);
      return;
    }

    setWarehouseLoading(false);

    try {
      const nextRows = await loadProductRows(id);
      setProducts(nextRows);
    } catch (error) {
      const message = getErrorMessage(error);
      setProducts([]);
      setProductsError(message);
      toast.danger(message);
    } finally {
      setProductsLoading(false);
    }
  }, [authorizedFetch, loadProductRows, toast, warehouseId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const closeFormModal = () => {
    setFormMode(null);
    setFormErrors({});
    setSubmitting(false);
  };

  const openAddModal = () => {
    setForm(emptyProductWarehouseForm);
    setFormErrors({});
    setFormMode("add");
  };

  const openEditModal = (row: WarehouseProductRow) => {
    setForm({
      productWarehouseId: row.product_warehouse_id,
      productId: row.product_id,
      quantity: String(row.quantity),
    });
    setFormErrors({});
    setFormMode("edit");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedForm = normalizeProductWarehouseForm(form);
    if (normalizedForm !== form) {
      setForm(normalizedForm);
    }

    const validationErrors = validateProductWarehouseForm(normalizedForm, formMode);
    if (hasErrors(validationErrors)) {
      setFormErrors(validationErrors);
      toast.danger("Проверьте ошибки в форме");
      return;
    }

    const id = warehouse?.warehouse_id || warehouseId?.trim();
    if (!id) {
      toast.danger("Некорректный идентификатор склада.");
      return;
    }

    setSubmitting(true);
    try {
      const quantity = Number.parseInt(normalizedForm.quantity, 10);
      if (formMode === "edit" && normalizedForm.productWarehouseId) {
        await updateProductInWarehouse(authorizedFetch, normalizedForm.productId, normalizedForm.productWarehouseId, quantity);
        toast.success("Количество товара обновлено");
      } else {
        await addProductToWarehouse(authorizedFetch, id, normalizedForm.productId, quantity);
        toast.success("Товар добавлен на склад");
      }

      closeFormModal();
      await loadPage();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteProductFromWarehouse(authorizedFetch, deleteCandidate.product_id, deleteCandidate.product_warehouse_id);
      setDeleteCandidate(null);
      toast.success("Товар удален со склада");
      await loadPage();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  if (warehouseError && !warehouseLoading) {
    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Package className="h-3.5 w-3.5" />
              Склады
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Информация о складе</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
              {warehouseError}
            </p>
          </div>
        </section>

        <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-slate-900/5">
          <Link to="/warehouses" className={actionLinkClass}>
            <ArrowLeft className="h-4 w-4" />
            Вернуться к складам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Package className="h-3.5 w-3.5" />
              Склады
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {warehouse ? warehouse.location : "Загрузка информации о складе..."}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                {warehouse
                  ? "Карточка склада и операции с товарами на этом складе."
                  : "Сначала загружается карточка склада, затем список товаров."}
              </p>
            </div>
          </div>

          <Link to="/warehouses" className={heroActionLinkClass}>
            <ArrowLeft className="h-4 w-4" />
            Вернуться к складам
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-slate-900/5">
        {warehouseLoading && !warehouse ? (
          <div className="flex items-center gap-3 py-10 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" role="status" />
            Загрузка склада...
          </div>
        ) : warehouse ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary">Карточка склада</p>
                <h2 className="text-2xl font-semibold tracking-tight">{warehouse.location}</h2>
                <p className="mt-1 text-sm text-muted-foreground">ID: {warehouse.warehouse_id}</p>
              </div>
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                  warehouse.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground",
                )}
              >
                {warehouse.is_active ? "Активен" : "Неактивен"}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <DetailCard label="Управляющий" value={warehouse.manager_name || "Не указано"} />
              <DetailCard label="Вместимость" value={String(warehouse.capacity)} />
              <DetailCard label="Текущий запас" value={String(warehouse.current_stock)} />
              <DetailCard label="Телефон" value={warehouse.contact_number || "Не указан"} />
              <DetailCard label="Email" value={warehouse.email || "Не указан"} />
              <DetailCard label="Площадь" value={formatAreaSize(warehouse.area_size)} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-4 border-b border-border px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Товары на складе</p>
            <h2 className="text-xl font-semibold tracking-tight">Список товаров</h2>
          </div>

          <RoleGuard minRole="operator">
            <Button type="button" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Добавить продукт на склад
            </Button>
          </RoleGuard>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[34%]" />
              <col className="w-[18%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">ID товара</th>
                <th className="px-6 py-4 font-semibold">Название</th>
                <th className="px-6 py-4 font-semibold">Количество на складе</th>
                <th className="px-6 py-4 font-semibold">Действия</th>
              </tr>
            </thead>
            <TableState
              loading={productsLoading}
              error={productsError}
              empty={products.length === 0}
              emptyMessage="На данном складе продуктов пока нет"
              colSpan={4}
            >
              {products.map((product) => (
                <tr key={product.product_warehouse_id} className="border-t border-border/60 align-top">
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <span className="block truncate" title={product.product_id}>
                      {product.product_id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="truncate font-medium text-foreground" title={product.name}>
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{product.quantity}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <RoleGuard minRole="operator">
                        <Button type="button" variant="outline-warning" size="sm" onClick={() => openEditModal(product)}>
                          <PencilLine className="h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button type="button" variant="outline-danger" size="sm" onClick={() => setDeleteCandidate(product)}>
                          <Trash2 className="h-4 w-4" />
                          Удалить
                        </Button>
                      </RoleGuard>
                    </div>
                  </td>
                </tr>
              ))}
            </TableState>
          </table>
        </div>
      </section>

      {formMode ? (
        <Modal
          title={formMode === "add" ? "Добавить продукт на склад" : "Редактировать количество"}
          onClose={closeFormModal}
          size="lg"
        >
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="ID товара"
                name="product-id"
                required
                value={form.productId}
                onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
                error={formErrors.productId}
                placeholder="UUID товара"
                readOnly={formMode === "edit"}
              />
              <Input
                type="number"
                label="Количество"
                name="quantity"
                required
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))}
                error={formErrors.quantity}
                min={formMode === "add" ? 1 : 0}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline-secondary" onClick={closeFormModal} disabled={submitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Сохранение..." : formMode === "add" ? "Добавить" : "Сохранить"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          title="Удалить товар со склада?"
          confirmLabel="Удалить"
          confirmVariant="danger"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={onDelete}
        >
          {deleteCandidate.name}. Количество на складе будет уменьшено на {deleteCandidate.quantity}.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function normalizeProductWarehouseForm(form: ProductWarehouseFormState): ProductWarehouseFormState {
  return {
    ...form,
    productId: form.productId.trim(),
    quantity: form.quantity.trim(),
  };
}

function validateProductWarehouseForm(form: ProductWarehouseFormState, mode: "add" | "edit" | null) {
  const quantityMessage = mode === "edit" ? "Количество должно быть неотрицательным целым числом." : "Количество должно быть положительным целым числом.";

  return collectErrors([
    ["productId", required(form.productId, "ID товара обязателен.")],
    [
      "quantity",
      mode === "edit"
        ? nonNegativeInteger(form.quantity, quantityMessage)
        : isPositiveInteger(form.quantity)
          ? ""
          : quantityMessage,
    ],
  ]);
}

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && Number.parseInt(value, 10) > 0;
}

function formatAreaSize(value: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Не указана";
  }

  return String(value);
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
