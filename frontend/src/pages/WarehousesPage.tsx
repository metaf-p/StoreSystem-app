import { type ReactNode, FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Eye, PencilLine, Plus, Trash2 } from "lucide-react";
import { createWarehouse, deleteWarehouse, listWarehouses, updateWarehouse } from "../api/warehouses";
import { getErrorMessage } from "../lib/http";
import {
  collectErrors,
  email as validateEmail,
  hasErrors,
  maxLength,
  matches,
  nonNegativeInteger,
  positiveNumber,
  required,
} from "../lib/validation";
import { useAuth } from "../state/AuthContext";
import type { Warehouse, WarehousePayload } from "../types";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { RoleGuard } from "../ui/RoleGuard";
import { Select } from "../ui/Select";
import { TableState } from "../ui/TableState";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";

type WarehouseFormState = {
  warehouseId?: string;
  location: string;
  managerName: string;
  capacity: string;
  currentStock: string;
  contactNumber: string;
  email: string;
  isActive: "active" | "inactive";
  areaSize: string;
};

type WarehouseFormErrors = Partial<Record<keyof WarehouseFormState, string>>;

const emptyWarehouseForm: WarehouseFormState = {
  location: "",
  managerName: "",
  capacity: "",
  currentStock: "0",
  contactNumber: "",
  email: "",
  isActive: "active",
  areaSize: "",
};

const actionLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background px-4 py-2 text-sm font-medium text-primary shadow-sm transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function WarehousesPage() {
  const { authorizedFetch } = useAuth();
  const toast = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<WarehouseFormState>(emptyWarehouseForm);
  const [formErrors, setFormErrors] = useState<WarehouseFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Warehouse | null>(null);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setTableError("");

    try {
      setWarehouses(await listWarehouses(authorizedFetch));
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, toast]);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const openCreateModal = () => {
    setForm(emptyWarehouseForm);
    setFormErrors({});
    setFormMode("create");
  };

  const openEditModal = (warehouse: Warehouse) => {
    setForm(warehouseToForm(warehouse));
    setFormErrors({});
    setFormMode("edit");
  };

  const closeFormModal = () => {
    setFormMode(null);
    setFormErrors({});
    setSubmitting(false);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedForm = normalizeWarehouseForm(form);
    if (normalizedForm !== form) {
      setForm(normalizedForm);
    }

    const validationErrors = validateWarehouseForm(normalizedForm);
    if (hasErrors(validationErrors)) {
      setFormErrors(validationErrors);
      toast.danger("Проверьте ошибки в форме");
      return;
    }

    setSubmitting(true);
    try {
      const payload = warehouseFormToPayload(normalizedForm);
      if (formMode === "edit" && form.warehouseId) {
        await updateWarehouse(authorizedFetch, form.warehouseId, payload);
        toast.success("Склад успешно обновлен");
      } else {
        await createWarehouse(authorizedFetch, payload);
        toast.success("Склад успешно добавлен");
      }

      closeFormModal();
      await loadWarehouses();
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
      await deleteWarehouse(authorizedFetch, deleteCandidate.warehouse_id);
      setDeleteCandidate(null);
      toast.success("Склад удален");
      await loadWarehouses();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Building2 className="h-3.5 w-3.5" />
              Склады
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Управление складами</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Список складов с быстрым переходом в детали и операциями создания, редактирования и удаления для операторов и администраторов.
              </p>
            </div>
          </div>

          <RoleGuard minRole="operator">
            <Button type="button" onClick={openCreateModal} className="shadow-lg shadow-sky-950/20">
              <Plus className="h-4 w-4" />
              Добавить новый склад
            </Button>
          </RoleGuard>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight">Список складов</h2>
        </div>

        <div className="md:hidden">
          <MobileWarehouseState loading={loading} error={tableError} empty={warehouses.length === 0}>
            <div className="divide-y divide-border">
              {warehouses.map((warehouse) => (
                <article key={warehouse.warehouse_id} className="space-y-4 px-6 py-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="truncate font-medium text-foreground" title={warehouse.location}>
                        {warehouse.location}
                      </div>
                      <div className="break-all text-xs text-muted-foreground">{warehouse.warehouse_id}</div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                        warehouse.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {warehouse.is_active ? "Активен" : "Неактивен"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MobileWarehouseField label="Управляющий" value={warehouse.manager_name || "Не указано"} />
                    <MobileWarehouseField label="Вместимость" value={String(warehouse.capacity)} />
                    <MobileWarehouseField label="Текущий запас" value={String(warehouse.current_stock)} />
                    <MobileWarehouseField label="Площадь" value={formatAreaSize(warehouse.area_size)} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link to={`/warehouses/${warehouse.warehouse_id}`} className={actionLinkClass}>
                      <Eye className="h-4 w-4" />
                      Посмотреть
                    </Link>
                    <RoleGuard minRole="operator">
                      <Button type="button" variant="outline-warning" size="sm" onClick={() => openEditModal(warehouse)}>
                        <PencilLine className="h-4 w-4" />
                        Редактировать
                      </Button>
                      <Button type="button" variant="outline-danger" size="sm" onClick={() => setDeleteCandidate(warehouse)}>
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </Button>
                    </RoleGuard>
                  </div>
                </article>
              ))}
            </div>
          </MobileWarehouseState>
        </div>

        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Местоположение</th>
                <th className="px-6 py-4 font-semibold">Управляющий</th>
                <th className="px-6 py-4 font-semibold">Вместимость</th>
                <th className="px-6 py-4 font-semibold">Текущий запас</th>
                <th className="px-6 py-4 font-semibold">Активность</th>
                <th className="px-6 py-4 font-semibold">Площадь</th>
                <th className="px-6 py-4 font-semibold">Действия</th>
              </tr>
            </thead>
            <TableState loading={loading} error={tableError} empty={warehouses.length === 0} emptyMessage="Склады не найдены." colSpan={7}>
              {warehouses.map((warehouse) => (
                <tr key={warehouse.warehouse_id} className="border-t border-border/60 align-top">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="truncate font-medium text-foreground" title={warehouse.location}>
                        {warehouse.location}
                      </div>
                      <div className="text-xs text-muted-foreground">{warehouse.warehouse_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <span className="block truncate">{warehouse.manager_name || "Не указано"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{warehouse.capacity}</td>
                  <td className="px-6 py-4 text-sm font-medium">{warehouse.current_stock}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                        warehouse.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {warehouse.is_active ? "Активен" : "Неактивен"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{formatAreaSize(warehouse.area_size)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/warehouses/${warehouse.warehouse_id}`} className={actionLinkClass}>
                        <Eye className="h-4 w-4" />
                        Посмотреть
                      </Link>
                      <RoleGuard minRole="operator">
                        <Button type="button" variant="outline-warning" size="sm" onClick={() => openEditModal(warehouse)}>
                          <PencilLine className="h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button type="button" variant="outline-danger" size="sm" onClick={() => setDeleteCandidate(warehouse)}>
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
        </div>
      </section>

      {formMode ? (
        <Modal
          title={formMode === "create" ? "Создание склада" : "Редактирование склада"}
          onClose={closeFormModal}
          size="lg"
        >
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Местоположение"
                name="location"
                required
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                error={formErrors.location}
                placeholder="Введите местоположение склада"
                maxLength={255}
              />
              <Input
                label="Имя управляющего"
                name="manager-name"
                value={form.managerName}
                onChange={(event) => setForm((current) => ({ ...current, managerName: event.target.value }))}
                error={formErrors.managerName}
                placeholder="Имя управляющего"
                maxLength={100}
              />
              <Input
                type="number"
                label="Вместимость"
                name="capacity"
                required
                value={form.capacity}
                onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
                error={formErrors.capacity}
                placeholder="Введите вместимость склада"
                min={1}
              />
              <Input
                type="number"
                label="Текущий запас"
                name="current-stock"
                required
                value={form.currentStock}
                onChange={(event) => setForm((current) => ({ ...current, currentStock: event.target.value }))}
                error={formErrors.currentStock}
                placeholder="0"
                min={0}
              />
              <Input
                label="Контактный телефон"
                name="contact-number"
                value={form.contactNumber}
                onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))}
                error={formErrors.contactNumber}
                placeholder="+79009999999"
                maxLength={15}
              />
              <Input
                type="email"
                label="Контактный email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                error={formErrors.email}
                placeholder="email@example.com"
                maxLength={255}
              />
              <Select
                name="is-active"
                label="Активность"
                value={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value as "active" | "inactive" }))}
                error={formErrors.isActive}
                wrapperClassName="space-y-2"
              >
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
              </Select>
              <Input
                label="Площадь"
                name="area-size"
                value={form.areaSize}
                onChange={(event) => setForm((current) => ({ ...current, areaSize: event.target.value }))}
                error={formErrors.areaSize}
                placeholder="100.25"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline-secondary" onClick={closeFormModal} disabled={submitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Сохранение..." : formMode === "create" ? "Создать склад" : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          title="Удалить склад?"
          confirmLabel="Удалить"
          confirmVariant="danger"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={onDelete}
        >
          {deleteCandidate.location}. После удаления склад станет недоступен.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function warehouseToForm(warehouse: Warehouse): WarehouseFormState {
  return {
    warehouseId: warehouse.warehouse_id,
    location: warehouse.location,
    managerName: warehouse.manager_name || "",
    capacity: String(warehouse.capacity),
    currentStock: String(warehouse.current_stock),
    contactNumber: warehouse.contact_number || "",
    email: warehouse.email || "",
    isActive: warehouse.is_active ? "active" : "inactive",
    areaSize: warehouse.area_size === null || warehouse.area_size === undefined ? "" : String(warehouse.area_size),
  };
}

function normalizeWarehouseForm(form: WarehouseFormState): WarehouseFormState {
  return {
    ...form,
    location: form.location.trim(),
    managerName: form.managerName.trim(),
    capacity: form.capacity.trim(),
    currentStock: form.currentStock.trim(),
    contactNumber: form.contactNumber.trim(),
    email: form.email.trim(),
    areaSize: form.areaSize.trim().replace(",", "."),
  };
}

function validateWarehouseForm(form: WarehouseFormState) {
  return collectErrors([
    ["location", required(form.location, "Местоположение обязательно.") || maxLength(form.location, 255, "Местоположение должно быть не длиннее 255 символов.")],
    [
      "managerName",
      form.managerName
        ? maxLength(form.managerName, 100, "Имя управляющего должно быть не длиннее 100 символов.") ||
          matches(form.managerName, /^[A-Za-zА-Яа-я\s]+$/, "Имя управляющего может содержать только буквы и пробелы.")
        : "",
    ],
    ["capacity", isPositiveInteger(form.capacity) ? "" : "Вместимость должна быть положительным целым числом."],
    ["currentStock", nonNegativeInteger(form.currentStock, "Текущий запас должен быть неотрицательным целым числом.")],
    [
      "contactNumber",
      form.contactNumber
        ? maxLength(form.contactNumber, 15, "Телефон должен быть не длиннее 15 символов.") ||
          matches(form.contactNumber, /^\+?\d+$/, "Телефон может содержать только цифры и символ '+' в начале.")
        : "",
    ],
    [
      "email",
      form.email
        ? maxLength(form.email, 255, "Email должен быть не длиннее 255 символов.") ||
          validateEmail(form.email, "Введите корректный email.")
        : "",
    ],
    [
      "areaSize",
      form.areaSize ? positiveNumber(form.areaSize, 1_000_000, "Площадь должна быть положительным числом.") : "",
    ],
  ]);
}

function warehouseFormToPayload(form: WarehouseFormState): WarehousePayload {
  return {
    location: form.location,
    manager_name: form.managerName ? form.managerName : null,
    capacity: Number.parseInt(form.capacity, 10),
    current_stock: Number.parseInt(form.currentStock, 10),
    contact_number: form.contactNumber ? form.contactNumber : null,
    email: form.email ? form.email : null,
    is_active: form.isActive === "active",
    area_size: form.areaSize ? Number(form.areaSize.replace(",", ".")) : null,
  };
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

function MobileWarehouseState({
  children,
  empty,
  emptyMessage,
  error,
  loading,
}: {
  children: ReactNode;
  empty: boolean;
  emptyMessage?: string;
  error?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">
        <div className="inline-flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" role="status" />
          Загрузка...
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="px-6 py-10 text-center text-sm text-destructive">{error}</div>;
  }

  if (empty) {
    return <div className="px-6 py-10 text-center text-sm text-muted-foreground">{emptyMessage || "Склады не найдены."}</div>;
  }

  return <>{children}</>;
}

function MobileWarehouseField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
