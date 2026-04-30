import { FormEvent, useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Download, FileText, PencilLine, Plus, Search, Trash2, Upload } from "lucide-react";
import {
  createSupplier,
  deleteSupplier,
  deleteSupplierDocument,
  downloadSupplierDocument,
  listSupplierDocuments,
  listSuppliers,
  searchSuppliers,
  updateSupplier,
  uploadSupplierDocument,
} from "../api/suppliers";
import { ApiError, getErrorMessage } from "../lib/http";
import { collectErrors, email, hasErrors, lengthBetween, maxLength, matches, required } from "../lib/validation";
import { useAuth } from "../state/AuthContext";
import type { Supplier, SupplierDocument, SupplierDocumentType, SupplierPayload } from "../types";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Field } from "../ui/Field";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { RoleGuard } from "../ui/RoleGuard";
import { Select } from "../ui/Select";
import { TableState } from "../ui/TableState";
import { useToast } from "../ui/Toast";

type SupplierFormState = {
  supplierId?: string;
  name: string;
  contactName: string;
  contactEmail: string;
  phoneNumber: string;
  address: string;
  country: string;
  city: string;
  website: string;
};

type SupplierFormErrors = Partial<Record<keyof SupplierFormState, string>>;

type SupplierDocumentFormState = {
  documentType: SupplierDocumentType;
  description: string;
  file: File | null;
};

type SupplierDocumentFormErrors = Partial<Record<"file", string>>;

const emptySupplierForm: SupplierFormState = {
  name: "",
  contactName: "",
  contactEmail: "",
  phoneNumber: "",
  address: "",
  country: "",
  city: "",
  website: "",
};

const emptyDocumentForm: SupplierDocumentFormState = {
  documentType: "contract",
  description: "",
  file: null,
};

const documentTypeLabels: Record<SupplierDocumentType, string> = {
  contract: "Договор",
  certificate: "Сертификат",
  requisites: "Реквизиты",
  price_list: "Прайс-лист",
  other: "Другое",
};

export function SuppliersPage() {
  const { accessToken, authorizedFetch, refreshAccessToken } = useAuth();
  const toast = useToast();
  const supplierDocumentFormRef = useRef<HTMLFormElement>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchName, setSearchName] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [form, setForm] = useState<SupplierFormState>(emptySupplierForm);
  const [formErrors, setFormErrors] = useState<SupplierFormErrors>({});
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);
  const [documentsSupplier, setDocumentsSupplier] = useState<Supplier | null>(null);
  const [documents, setDocuments] = useState<SupplierDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [documentForm, setDocumentForm] = useState<SupplierDocumentFormState>(emptyDocumentForm);
  const [documentFormErrors, setDocumentFormErrors] = useState<SupplierDocumentFormErrors>({});
  const [documentSubmitting, setDocumentSubmitting] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Supplier | null>(null);
  const [deleteDocumentCandidate, setDeleteDocumentCandidate] = useState<SupplierDocument | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setTableError("");
    try {
      setSuppliers(await listSuppliers(authorizedFetch));
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, toast]);

  const loadDocuments = useCallback(
    async (supplierId: string) => {
      setDocumentsLoading(true);
      setDocumentsError("");
      try {
        setDocuments(await listSupplierDocuments(authorizedFetch, supplierId));
      } catch (error) {
        const message = getErrorMessage(error);
        setDocumentsError(message);
        toast.danger(message);
      } finally {
        setDocumentsLoading(false);
      }
    },
    [authorizedFetch, toast],
  );

  const requireAccessToken = useCallback(async () => {
    const token = accessToken || (await refreshAccessToken());
    if (!token) {
      throw new ApiError("Unauthorized", 401);
    }
    return token;
  }, [accessToken, refreshAccessToken]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const onSearch = async (event: FormEvent) => {
    event.preventDefault();
    const query = searchName.trim();

    if (!query) {
      await loadSuppliers();
      return;
    }

    setLoading(true);
    setTableError("");
    try {
      const nextSuppliers = await searchSuppliers(authorizedFetch, query);
      setSuppliers(nextSuppliers);
      if (nextSuppliers.length === 0) {
        toast.info("Поставщики не найдены");
      }
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(emptySupplierForm);
    setFormErrors({});
    setFormMode("create");
  };

  const openEditModal = (supplier: Supplier) => {
    setForm(supplierToForm(supplier));
    setFormErrors({});
    setFormMode("edit");
  };

  const openDocumentsModal = (supplier: Supplier) => {
    setDocumentsSupplier(supplier);
    setDocuments([]);
    setDocumentsError("");
    setDeleteDocumentCandidate(null);
    setDocumentForm(emptyDocumentForm);
    setDocumentFormErrors({});
    setDocumentSubmitting(false);
    supplierDocumentFormRef.current?.reset();
    void loadDocuments(supplier.supplier_id);
  };

  const closeDocumentsModal = () => {
    setDocumentsSupplier(null);
    setDocuments([]);
    setDocumentsError("");
    setDeleteDocumentCandidate(null);
    setDocumentForm(emptyDocumentForm);
    setDocumentFormErrors({});
    setDocumentSubmitting(false);
    supplierDocumentFormRef.current?.reset();
  };

  const onSubmitSupplier = async (event: FormEvent) => {
    event.preventDefault();
    const normalizedForm = normalizeSupplierForm(form);
    if (normalizedForm !== form) {
      setForm(normalizedForm);
    }

    const validationErrors = validateSupplierForm(normalizedForm);
    if (hasErrors(validationErrors)) {
      setFormErrors(validationErrors);
      toast.danger("Проверьте ошибки в форме");
      return;
    }

    setSupplierSubmitting(true);
    try {
      const payload = supplierFormToPayload(normalizedForm);
      if (formMode === "edit" && form.supplierId) {
        await updateSupplier(authorizedFetch, form.supplierId, payload);
        toast.success("Поставщик успешно обновлен");
      } else {
        await createSupplier(authorizedFetch, payload);
        toast.success("Поставщик успешно добавлен");
      }

      setFormMode(null);
      setForm(emptySupplierForm);
      await loadSuppliers();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const onDeleteSupplier = async () => {
    if (!deleteCandidate) {
      return;
    }

    try {
      await deleteSupplier(authorizedFetch, deleteCandidate.supplier_id);
      setDeleteCandidate(null);
      toast.success("Поставщик удален");
      await loadSuppliers();
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  const onSubmitDocument = async (event: FormEvent) => {
    event.preventDefault();
    if (!documentsSupplier) {
      return;
    }

    const file = documentForm.file;
    const validationErrors: SupplierDocumentFormErrors = file ? {} : { file: "Выберите файл документа." };
    if (hasErrors(validationErrors)) {
      setDocumentFormErrors(validationErrors);
      toast.danger("Проверьте ошибки в форме");
      return;
    }

    const selectedFile = file;
    if (!selectedFile) {
      return;
    }
    setDocumentSubmitting(true);
    try {
      const token = await requireAccessToken();
      await uploadSupplierDocument(
        token,
        refreshAccessToken,
        documentsSupplier.supplier_id,
        selectedFile,
        documentForm.documentType,
        documentForm.description.trim() || null,
      );
      toast.success("Документ загружен");
      setDocumentForm(emptyDocumentForm);
      setDocumentFormErrors({});
      supplierDocumentFormRef.current?.reset();
      await loadDocuments(documentsSupplier.supplier_id);
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setDocumentSubmitting(false);
    }
  };

  const onDownloadDocument = async (document: SupplierDocument) => {
    if (!documentsSupplier) {
      return;
    }

    try {
      const token = await requireAccessToken();
      const blob = await downloadSupplierDocument(token, refreshAccessToken, documentsSupplier.supplier_id, document.document_id);
      downloadBlob(blob, document.original_filename);
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  const onDeleteDocument = async () => {
    if (!documentsSupplier || !deleteDocumentCandidate) {
      return;
    }

    try {
      await deleteSupplierDocument(authorizedFetch, documentsSupplier.supplier_id, deleteDocumentCandidate.document_id);
      toast.success("Документ удалён");
      setDeleteDocumentCandidate(null);
      await loadDocuments(documentsSupplier.supplier_id);
    } catch (error) {
      toast.danger(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Suppliers</p>
            <h1 className="text-3xl font-semibold tracking-tight">Управление поставщиками</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Поиск, просмотр, редактирование, документы и удаление поставщиков в одном месте.
            </p>
          </div>

          <RoleGuard minRole="operator">
            <Button type="button" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Добавить нового поставщика
            </Button>
          </RoleGuard>
        </div>

        <form className="mt-6 flex flex-col gap-3 sm:flex-row" onSubmit={onSearch} noValidate>
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
            <Search className="h-4 w-4" />
            Найти
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Список поставщиков</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] table-fixed border-separate border-spacing-0">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-[170px] px-4 py-4 whitespace-nowrap">Название</th>
                <th className="w-[150px] px-4 py-4 whitespace-nowrap">Контактное лицо</th>
                <th className="w-[210px] px-4 py-4 whitespace-nowrap">Email</th>
                <th className="w-[150px] px-4 py-4 whitespace-nowrap">Телефон</th>
                <th className="w-[120px] px-4 py-4 whitespace-nowrap">Страна</th>
                <th className="w-[120px] px-4 py-4 whitespace-nowrap">Город</th>
                <th className="w-[220px] px-4 py-4 whitespace-nowrap">Адрес</th>
                <th className="w-[220px] px-4 py-4 whitespace-nowrap">Website</th>
                <th className="w-[240px] px-4 py-4 text-center whitespace-nowrap">Действия</th>
              </tr>
            </thead>
            <TableState loading={loading} error={tableError} empty={suppliers.length === 0} emptyMessage="Поставщики не найдены" colSpan={9}>
              {suppliers.map((supplier) => (
                <tr key={supplier.supplier_id} className="border-t border-border/60 text-sm">
                  <td className="px-4 py-4 align-top font-medium text-foreground">{supplier.name}</td>
                  <td className="px-4 py-4 align-top text-muted-foreground">{supplier.contact_name}</td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    <span className="block break-words">{supplier.contact_email || "—"}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    <span className="block break-words">{supplier.phone_number || "—"}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    <span className="block break-words">{supplier.country || "—"}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    <span className="block break-words">{supplier.city || "—"}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    <span className="block break-words">{supplier.address || "—"}</span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground">
                    {supplier.website ? (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noreferrer"
                        className="block break-words font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {supplier.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4 align-top text-center">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button variant="outline-primary" size="sm" type="button" onClick={() => openDocumentsModal(supplier)}>
                        <FileText className="h-4 w-4" />
                        Документы
                      </Button>
                      <RoleGuard minRole="operator">
                        <Button variant="outline-warning" size="sm" type="button" onClick={() => openEditModal(supplier)}>
                          <PencilLine className="h-4 w-4" />
                          Редактировать
                        </Button>
                        <Button variant="outline-danger" size="sm" type="button" onClick={() => setDeleteCandidate(supplier)}>
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

      {formMode ? (
        <Modal title={formMode === "create" ? "Создание поставщика" : "Редактирование поставщика"} onClose={() => setFormMode(null)} size="lg">
          <SupplierForm
            form={form}
            errors={formErrors}
            mode={formMode}
            submitting={supplierSubmitting}
            onChange={(nextForm, changedField) => {
              setForm(nextForm);
              if (changedField) {
                setFormErrors((current) => ({ ...current, [changedField]: undefined }));
              }
            }}
            onSubmit={onSubmitSupplier}
          />
        </Modal>
      ) : null}

      {documentsSupplier ? (
        <Modal title={`Документы: ${documentsSupplier.name}`} onClose={closeDocumentsModal} size="lg">
          <SupplierDocumentsModal
            supplier={documentsSupplier}
            documents={documents}
            loading={documentsLoading}
            error={documentsError}
            documentForm={documentForm}
            documentFormErrors={documentFormErrors}
            submitting={documentSubmitting}
            formRef={supplierDocumentFormRef}
            onChange={(nextForm, changedField) => {
              setDocumentForm(nextForm);
              if (changedField) {
                setDocumentFormErrors((current) => ({ ...current, [changedField]: undefined }));
              }
            }}
            onSubmit={onSubmitDocument}
            onDownload={onDownloadDocument}
            onRequestDelete={setDeleteDocumentCandidate}
          />
        </Modal>
      ) : null}

      {deleteCandidate ? (
        <ConfirmDialog
          title="Удалить поставщика?"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={onDeleteSupplier}
          confirmLabel="Удалить"
        >
          Поставщик <strong>{deleteCandidate.name}</strong> будет удален. Если он связан с продуктами или документами, сервер вернет причину блокировки.
        </ConfirmDialog>
      ) : null}

      {deleteDocumentCandidate && documentsSupplier ? (
        <ConfirmDialog
          title="Удалить документ?"
          onCancel={() => setDeleteDocumentCandidate(null)}
          onConfirm={onDeleteDocument}
          confirmLabel="Удалить"
        >
          Документ <strong>{deleteDocumentCandidate.original_filename}</strong> будет удален.
        </ConfirmDialog>
      ) : null}
    </div>
  );
}

function SupplierForm({
  form,
  errors,
  mode,
  submitting,
  onChange,
  onSubmit,
}: {
  form: SupplierFormState;
  errors: SupplierFormErrors;
  mode: "create" | "edit";
  submitting: boolean;
  onChange: (form: SupplierFormState, changedField?: keyof SupplierFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const setField = (field: keyof SupplierFormState, value: string) => {
    onChange({ ...form, [field]: value }, field);
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Название поставщика (обязательно)"
        name="name"
        value={form.name}
        error={errors.name}
        required
        onChange={(event) => setField("name", event.target.value)}
      />
      <Input
        label="Контактное лицо (обязательно)"
        name="contact-name"
        value={form.contactName}
        error={errors.contactName}
        required
        onChange={(event) => setField("contactName", event.target.value)}
      />
      <Input
        type="email"
        label="Email (обязательно)"
        name="contact-email"
        value={form.contactEmail}
        error={errors.contactEmail}
        required
        onChange={(event) => setField("contactEmail", event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="phone-number" label="Телефон" value={form.phoneNumber} error={errors.phoneNumber} onChange={(event) => setField("phoneNumber", event.target.value)} />
        <Input name="country" label="Страна" value={form.country} error={errors.country} onChange={(event) => setField("country", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="city" label="Город" value={form.city} error={errors.city} onChange={(event) => setField("city", event.target.value)} />
        <Input
          name="website"
          label="Website"
          value={form.website}
          error={errors.website}
          hint="Можно без http:// или https://"
          onChange={(event) => setField("website", event.target.value)}
        />
      </div>
      <Input name="address" label="Адрес" value={form.address} error={errors.address} onChange={(event) => setField("address", event.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохранение..." : mode === "create" ? "Создать поставщика" : "Сохранить изменения"}
        </Button>
      </div>
    </form>
  );
}

function SupplierDocumentsModal({
  supplier,
  documents,
  loading,
  error,
  documentForm,
  documentFormErrors,
  submitting,
  formRef,
  onChange,
  onSubmit,
  onDownload,
  onRequestDelete,
}: {
  supplier: Supplier;
  documents: SupplierDocument[];
  loading: boolean;
  error: string;
  documentForm: SupplierDocumentFormState;
  documentFormErrors: SupplierDocumentFormErrors;
  submitting: boolean;
  formRef: RefObject<HTMLFormElement>;
  onChange: (form: SupplierDocumentFormState, changedField?: keyof SupplierDocumentFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDownload: (document: SupplierDocument) => Promise<void>;
  onRequestDelete: (document: SupplierDocument | null) => void;
}) {
  const setField = (field: keyof SupplierDocumentFormState, value: string | File | null) => {
    onChange({ ...documentForm, [field]: value } as SupplierDocumentFormState, field);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        Поставщик: <span className="font-medium text-foreground">{supplier.name}</span>
      </div>

      <RoleGuard minRole="operator">
        <form ref={formRef} className="space-y-4 rounded-2xl border border-border bg-background p-4 shadow-sm" onSubmit={onSubmit} noValidate>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4 text-primary" />
            Загрузка документа
          </div>
          <Select
            name="document-type"
            label="Тип документа"
            required
            value={documentForm.documentType}
            onChange={(event) => setField("documentType", event.target.value as SupplierDocumentType)}
          >
            {Object.entries(documentTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Field htmlFor="supplier-document-description" label="Описание документа">
            <textarea
              id="supplier-document-description"
              className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              value={documentForm.description}
              onChange={(event) => setField("description", event.target.value)}
            />
          </Field>
          <Input
            type="file"
            name="document-file"
            label="Файл документа (обязательно)"
            error={documentFormErrors.file}
            required
            onChange={(event) => setField("file", event.target.files?.[0] || null)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Загрузка..." : "Загрузить документ"}
            </Button>
          </div>
        </form>
      </RoleGuard>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold tracking-tight">Список документов</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-separate border-spacing-0">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Тип</th>
                <th className="px-4 py-3">Файл</th>
                <th className="px-4 py-3">Размер</th>
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" role="status" />
                      Загрузка...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-destructive">
                    {error}
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    Документы не загружены
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.document_id} className="border-t border-border/60 text-sm">
                    <td className="px-4 py-3 align-top">{documentTypeLabels[document.document_type]}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{document.original_filename}</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{Math.ceil(document.file_size / 1024)} КБ</td>
                    <td className="px-4 py-3 align-top text-muted-foreground">{new Date(document.created_at).toLocaleString("ru-RU")}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                        <Button variant="outline-primary" size="sm" type="button" onClick={() => onDownload(document)}>
                          <Download className="h-4 w-4" />
                          Скачать
                        </Button>
                        <RoleGuard minRole="operator">
                          <Button variant="outline-danger" size="sm" type="button" onClick={() => onRequestDelete(document)}>
                            <Trash2 className="h-4 w-4" />
                            Удалить
                          </Button>
                        </RoleGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function supplierToForm(supplier: Supplier): SupplierFormState {
  return {
    supplierId: supplier.supplier_id,
    name: supplier.name,
    contactName: supplier.contact_name,
    contactEmail: supplier.contact_email,
    phoneNumber: supplier.phone_number || "",
    address: supplier.address || "",
    country: supplier.country || "",
    city: supplier.city || "",
    website: supplier.website || "",
  };
}

function normalizeSupplierForm(form: SupplierFormState): SupplierFormState {
  const normalizedWebsite = normalizeWebsiteInput(form.website);
  const nextForm = {
    supplierId: form.supplierId,
    name: form.name.trim(),
    contactName: form.contactName.trim(),
    contactEmail: form.contactEmail.trim(),
    phoneNumber: form.phoneNumber.trim(),
    address: form.address.trim(),
    country: form.country.trim(),
    city: form.city.trim(),
    website: normalizedWebsite,
  };

  if (
    nextForm.name === form.name &&
    nextForm.contactName === form.contactName &&
    nextForm.contactEmail === form.contactEmail &&
    nextForm.phoneNumber === form.phoneNumber &&
    nextForm.address === form.address &&
    nextForm.country === form.country &&
    nextForm.city === form.city &&
    nextForm.website === form.website
  ) {
    return form;
  }

  return nextForm;
}

function supplierFormToPayload(form: SupplierFormState): SupplierPayload {
  return {
    name: form.name.trim(),
    contact_name: form.contactName.trim(),
    contact_email: form.contactEmail.trim(),
    phone_number: form.phoneNumber.trim() || null,
    address: form.address.trim() || null,
    country: form.country.trim() || null,
    city: form.city.trim() || null,
    website: form.website.trim() || null,
  };
}

function validateSupplierForm(form: SupplierFormState) {
  const name = form.name.trim();
  const contactName = form.contactName.trim();
  const contactEmail = form.contactEmail.trim();
  const phoneNumber = form.phoneNumber.trim();
  const address = form.address.trim();
  const country = form.country.trim();
  const city = form.city.trim();
  const websiteInput = form.website.trim();
  const website = normalizeWebsiteInput(websiteInput);

  return collectErrors([
    [
      "name",
      required(name, "Название поставщика обязательно для заполнения.") ||
        lengthBetween(name, 3, 100, "Название должно быть от 3 до 100 символов."),
    ],
    [
      "contactName",
      required(contactName, "Контактное лицо обязательно для заполнения.") ||
        maxLength(contactName, 100, "Контактное лицо должно быть не более 100 символов."),
    ],
    [
      "contactEmail",
      required(contactEmail, "Email обязателен для заполнения.") ||
        email(contactEmail, "Введите корректный email.") ||
        maxLength(contactEmail, 100, "Email должен быть не более 100 символов.") ||
        (contactEmail.split("@")[0].length <= 20 ? "" : "Email должен содержать не более 20 символов до '@'."),
    ],
    [ "phoneNumber", phoneNumber ? matches(phoneNumber, /^\+?\d{1,15}$/, "Телефон должен содержать только цифры и символ '+', не более 15 символов.") : "" ],
    [ "address", address ? matches(address, /^[A-Za-zА-Яа-я0-9\s]{1,200}$/, "Адрес должен содержать только буквы, цифры и пробелы, не более 200 символов.") : "" ],
    [ "country", country ? matches(country, /^[A-Za-zА-Яа-я\s]{1,50}$/, "Страна должна содержать только буквы и пробелы, не более 50 символов.") : "" ],
    [ "city", city ? matches(city, /^[A-Za-zА-Яа-я\s-]{1,50}$/, "Город должен содержать только буквы, пробелы и дефисы, не более 50 символов.") : "" ],
    [
      "website",
      websiteInput
        ? websiteInput.length <= 255 && isValidWebsite(website)
          ? ""
          : "Веб-сайт должен быть валидным URL и не более 255 символов."
        : "",
    ],
  ]);
}

function normalizeWebsiteInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `http://${trimmed}`;
}

function isValidWebsite(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes("..")) {
      return false;
    }

    const hostnameParts = parsed.hostname.split(".");
    if (hostnameParts.length < 2) {
      return false;
    }

    if (!/^[a-zA-Z0-9-.]+$/.test(parsed.hostname)) {
      return false;
    }

    return hostnameParts.every((part) => part && !part.startsWith("-") && !part.endsWith("-"));
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
