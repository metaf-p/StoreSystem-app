import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  listSuppliers,
  searchProducts,
  updateProduct,
  uploadImage,
} from "../api/products";
import { PRODUCTS_API_URL } from "../config";
import { ApiError, getErrorMessage } from "../lib/http";
import { allowedFileExtension, collectErrors, hasErrors, matches, maxLength, nonNegativeInteger, positiveNumber, required } from "../lib/validation";
import { useAuth } from "../state/AuthContext";
import type { Product, ProductPayload, Supplier } from "../types";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { RoleGuard } from "../ui/RoleGuard";
import { Select } from "../ui/Select";
import { TableState } from "../ui/TableState";
import { useToast } from "../ui/Toast";

type ProductFormState = {
  productId?: string;
  name: string;
  description: string;
  category: string;
  price: string;
  stockQuantity: string;
  supplierId: string;
  imageFile: File | null;
  imageUrl: string | null;
  weight: string;
  dimensions: string;
  manufacturer: string;
};

type ProductFormErrors = Partial<Record<keyof ProductFormState, string>>;

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  stockQuantity: "",
  supplierId: "",
  imageFile: null,
  imageUrl: null,
  weight: "",
  dimensions: "",
  manufacturer: "",
};

export function ProductsPage() {
  const { accessToken, authorizedFetch, refreshAccessToken } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [formErrors, setFormErrors] = useState<ProductFormErrors>({});
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setTableError("");
    try {
      setProducts(await listProducts(authorizedFetch));
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, toast]);

  const loadSuppliers = useCallback(async () => {
    try {
      setSuppliers(await listSuppliers(authorizedFetch));
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  }, [authorizedFetch, toast]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const openCreateModal = async () => {
    setForm(emptyProductForm);
    setFormErrors({});
    setFormMode("create");
    await loadSuppliers();
  };

  const openEditModal = async (productId: string) => {
    try {
      const product = await getProduct(authorizedFetch, productId);
      setForm(productToForm(product));
      setFormErrors({});
      setFormMode("edit");
      await loadSuppliers();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  const openDetails = async (productId: string) => {
    try {
      setDetailsProduct(await getProduct(authorizedFetch, productId));
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  const onSearch = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setTableError("");
    try {
      const nextProducts = searchName.trim()
        ? await searchProducts(authorizedFetch, searchName.trim())
        : await listProducts(authorizedFetch);
      setProducts(nextProducts);
      if (nextProducts.length === 0) {
        toast.info("Продукты не найдены");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteProduct(authorizedFetch, deleteCandidate.product_id);
      setDeleteCandidate(null);
      await loadProducts();
      toast.success("Продукт удален");
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  const onSubmitProduct = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedForm = normalizeProductForm(form);
    if (normalizedForm !== form) {
      setForm(normalizedForm);
    }

    const validationErrors = validateProductForm(normalizedForm);
    if (hasErrors(validationErrors)) {
      setFormErrors(validationErrors);
      toast.danger("Проверьте ошибки в форме");
      return;
    }

    setSubmitting(true);
    try {
      const token = accessToken || (await refreshAccessToken());
      if (!token) {
        throw new ApiError("Unauthorized", 401);
      }

      let imageUrl = normalizedForm.imageUrl;
      if (normalizedForm.imageFile) {
        imageUrl = (await uploadImage(token, normalizedForm.imageFile)).imageUrl;
      }

      const payload = formToPayload(normalizedForm, imageUrl);
      if (formMode === "edit" && form.productId) {
        await updateProduct(authorizedFetch, form.productId, payload);
        toast.success("Продукт успешно обновлен");
      } else {
        await createProduct(authorizedFetch, payload);
        toast.success("Продукт успешно добавлен");
      }

      setFormMode(null);
      setForm(emptyProductForm);
      await loadProducts();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const supplierNameById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.supplier_id, supplier.name])),
    [suppliers],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Products</p>
            <h1 className="text-3xl font-semibold tracking-tight">Управление продуктами</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Поиск, просмотр, редактирование и удаление карточек продуктов в одном месте.
            </p>
          </div>

          <RoleGuard minRole="operator">
            <Button type="button" onClick={openCreateModal}>
              Добавить новый продукт
            </Button>
          </RoleGuard>
        </div>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={onSearch}>
          <Input
            type="text"
            name="search"
            placeholder="Введите название для поиска"
            label="Поиск"
            labelHidden
            wrapperClassName="mb-0 flex-1"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
          />
          <Button variant="outline-secondary" type="submit">
            Найти
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Список продуктов</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Название</th>
                <th className="px-6 py-4">Описание</th>
                <th className="px-6 py-4">Категория</th>
                <th className="px-6 py-4">Цена</th>
                <th className="px-6 py-4 text-center">Действия</th>
              </tr>
            </thead>
            <TableState loading={loading} error={tableError} empty={products.length === 0} emptyMessage="Продукты не найдены" colSpan={6}>
              {products.map((product) => (
                <tr key={product.product_id} className="border-t border-border/60 text-sm">
                  <td className="max-w-[230px] whitespace-nowrap px-6 py-4 align-top font-mono text-xs text-muted-foreground">
                    {product.product_id}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="block max-w-[220px] truncate text-left font-medium text-primary underline-offset-4 hover:underline"
                      type="button"
                      onClick={() => openDetails(product.product_id)}
                    >
                      {product.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 align-top text-muted-foreground">{product.description || ""}</td>
                  <td className="px-6 py-4 align-top">{product.category || ""}</td>
                  <td className="px-6 py-4 align-top">{product.price} руб</td>
                  <td className="px-6 py-4 text-center align-top">
                    <RoleGuard minRole="operator">
                      <div className="flex flex-col justify-center gap-2 sm:flex-row">
                        <Button variant="outline-warning" size="sm" type="button" onClick={() => openEditModal(product.product_id)}>
                          Редактировать
                        </Button>
                        <Button variant="outline-danger" size="sm" type="button" onClick={() => setDeleteCandidate(product)}>
                          Удалить
                        </Button>
                      </div>
                    </RoleGuard>
                  </td>
                </tr>
              ))}
            </TableState>
          </table>
        </div>
      </div>

      {formMode ? (
        <Modal title={formMode === "create" ? "Добавить новый продукт" : "Редактировать продукт"} onClose={() => setFormMode(null)} size="lg">
          <ProductForm
            form={form}
            errors={formErrors}
            suppliers={suppliers}
            submitting={submitting}
            mode={formMode}
            onChange={(nextForm, changedField) => {
              setForm(nextForm);
              if (changedField) {
                setFormErrors((current) => ({ ...current, [changedField]: undefined }));
              }
            }}
            onSubmit={onSubmitProduct}
          />
        </Modal>
      ) : null}

      {detailsProduct ? (
        <Modal title={detailsProduct.name} onClose={() => setDetailsProduct(null)} size="lg">
          <ProductDetails product={detailsProduct} supplierName={supplierNameById.get(detailsProduct.supplier_id)} />
        </Modal>
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          title="Удалить продукт?"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={onDelete}
          confirmLabel="Удалить"
        >
          Продукт <strong>{deleteCandidate.name}</strong> будет удален. Если он связан со складом, сервер вернет причину блокировки.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function ProductForm({
  form,
  errors,
  suppliers,
  submitting,
  mode,
  onChange,
  onSubmit,
}: {
  form: ProductFormState;
  errors: ProductFormErrors;
  suppliers: Supplier[];
  submitting: boolean;
  mode: "create" | "edit";
  onChange: (form: ProductFormState, changedField?: keyof ProductFormState) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  const setField = (field: keyof ProductFormState, value: string | File | null) => {
    onChange({ ...form, [field]: value }, field);
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Название продукта (обязательно)"
        name="name"
        value={form.name}
        error={errors.name}
        required
        onChange={(event) => setField("name", event.target.value)}
      />
      <Input
        label="Описание"
        name="description"
        value={form.description}
        error={errors.description}
        onChange={(event) => setField("description", event.target.value)}
      />
      <Input name="category" label="Категория" value={form.category} error={errors.category} onChange={(event) => setField("category", event.target.value)} />
      <Input
        label="Цена (руб)(обязательно)"
        name="price"
        value={form.price}
        error={errors.price}
        required
        onChange={(event) => setField("price", event.target.value.replace(",", "."))}
      />
      <Input
        type="number"
        name="stock-quantity"
        label="Количество продукта (обязательно)"
        value={form.stockQuantity}
        error={errors.stockQuantity}
        required
        onChange={(event) => setField("stockQuantity", event.target.value)}
      />
      <Select
        name="supplier-id"
        label="Поставщик (обязательно)"
        error={errors.supplierId}
        required
        value={form.supplierId}
        onChange={(event) => setField("supplierId", event.target.value)}
      >
        <option value="" disabled>
          Выберите поставщика
        </option>
        {suppliers.map((supplier) => (
          <option key={supplier.supplier_id} value={supplier.supplier_id}>
            {supplier.name}
          </option>
        ))}
      </Select>
      <Input
        type="file"
        name="image-file"
        label="Изображение продукта"
        error={errors.imageFile}
        hint={mode === "edit" && form.imageUrl ? "Текущее изображение будет сохранено, если не выбрать новый файл." : undefined}
        accept=".png,.jpeg,.jpg"
        onChange={(event) => setField("imageFile", event.target.files?.[0] || null)}
      />
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        name="weight"
        label="Вес партии продукта (кг)"
        value={form.weight}
        error={errors.weight}
        onChange={(event) => setField("weight", event.target.value.replace(",", "."))}
      />
      <Input name="dimensions" label="Габариты продукта (1х1х1 метра)" value={form.dimensions} error={errors.dimensions} onChange={(event) => setField("dimensions", event.target.value)} />
      <Input name="manufacturer" label="Производитель" value={form.manufacturer} error={errors.manufacturer} onChange={(event) => setField("manufacturer", event.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : mode === "create" ? "Создать продукт" : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}

function ProductDetails({ product, supplierName }: { product: Product; supplierName?: string }) {
  const imageSrc = product.image_url?.startsWith("http") ? product.image_url : `${PRODUCTS_API_URL}${product.image_url || ""}`;

  return (
    <div className="space-y-4">
      {product.image_url ? <img className="h-64 w-full rounded-2xl border border-border object-contain bg-muted/20" src={imageSrc} alt={product.name} /> : null}
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <DetailItem label="Описание" value={product.description || "Нет описания"} />
        <DetailItem label="Категория" value={product.category || "Нет категории"} />
        <DetailItem label="Цена" value={`${product.price} руб`} />
        <DetailItem label="Количество на складе" value={String(product.stock_quantity)} />
        <DetailItem label="Поставщик" value={supplierName || product.supplier_id} />
        <DetailItem label="Вес" value={product.weight ? `${product.weight} кг` : "Нет данных"} />
        <DetailItem label="Габариты" value={product.dimensions || "Нет данных"} />
        <DetailItem label="Производитель" value={product.manufacturer || "Нет данных"} />
      </dl>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function productToForm(product: Product): ProductFormState {
  return {
    productId: product.product_id,
    name: product.name,
    description: product.description || "",
    category: product.category || "",
    price: String(product.price),
    stockQuantity: String(product.stock_quantity),
    supplierId: product.supplier_id,
    imageFile: null,
    imageUrl: product.image_url,
    weight: normalizeDecimalInput(product.weight),
    dimensions: product.dimensions || "",
    manufacturer: product.manufacturer || "",
  };
}

function formToPayload(form: ProductFormState, imageUrl: string | null): ProductPayload {
  const weight = normalizeDecimalInput(form.weight);

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    category: form.category.trim() || null,
    price: form.price.trim(),
    stock_quantity: Number.parseInt(form.stockQuantity, 10),
    supplier_id: form.supplierId,
    image_url: imageUrl,
    weight: weight || null,
    dimensions: form.dimensions.trim() || null,
    manufacturer: form.manufacturer.trim() || null,
  };
}

function normalizeProductForm(form: ProductFormState): ProductFormState {
  const weight = normalizeDecimalInput(form.weight);
  if (weight === form.weight) {
    return form;
  }
  return { ...form, weight };
}

function validateProductForm(form: ProductFormState) {
  const name = form.name.trim();
  const category = form.category.trim();
  const price = form.price.trim().replace(",", ".");
  const weight = normalizeDecimalInput(form.weight);
  const dimensions = form.dimensions.trim();
  const manufacturer = form.manufacturer.trim();

  return collectErrors([
    [
      "name",
      required(name, "Название продукта обязательно для заполнения.") ||
        matches(name, /^[а-яА-Яa-zA-Z0-9\s]{3,100}$/, "Название должно быть от 3 до 100 символов, только буквы, цифры и пробелы."),
    ],
    ["description", maxLength(form.description.trim(), 500, "Описание не должно превышать 500 символов.")],
    [
      "category",
      category
        ? maxLength(category, 50, "Категория должна быть до 50 символов, только буквы и цифры.") ||
          matches(category, /^[а-яА-Яa-zA-Z0-9]+$/, "Категория должна быть до 50 символов, только буквы и цифры.")
        : "",
    ],
    [
      "price",
      required(price, "Цена обязательна для заполнения.") || positiveNumber(price, 9999999.99, "Цена должна быть положительным числом, максимум 9999999.99."),
    ],
    [
      "stockQuantity",
      required(form.stockQuantity, "Количество обязательно для заполнения.") ||
        nonNegativeInteger(form.stockQuantity, "Количество должно быть целым числом, не меньше 0."),
    ],
    ["supplierId", required(form.supplierId, "Необходимо выбрать поставщика.")],
    ["imageFile", allowedFileExtension(form.imageFile, [".png", ".jpeg", ".jpg"], "Формат изображения должен быть .png, .jpeg или .jpg.")],
    ["weight", weight ? positiveNumber(weight, 9999.99, "Вес должен быть положительным числом, максимум 9999.99.") : ""],
    [
      "dimensions",
      dimensions
        ? maxLength(dimensions, 100, 'Габариты должны быть в формате "1x2x3" и содержать не более 100 символов.') ||
          matches(dimensions, /^\d+x\d+x\d+$/, 'Габариты должны быть в формате "1x2x3" и содержать не более 100 символов.')
        : "",
    ],
    [
      "manufacturer",
      manufacturer ? matches(manufacturer, /^[а-яА-Яa-zA-Z0-9]{1,100}$/, "Производитель может содержать только буквы и цифры, максимум 100 символов.") : "",
    ],
  ]);
}

function normalizeDecimalInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const numericValue = Number(String(value).trim().replace(",", "."));
  if (Number.isNaN(numericValue)) {
    return String(value).trim().replace(",", ".");
  }
  return numericValue.toFixed(2);
}
