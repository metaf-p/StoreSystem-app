import { useCallback, useEffect, useState } from "react";
import { deleteProduct } from "../api/products";
import { getErrorMessage } from "../lib/http";
import { useAuth } from "../state/AuthContext";
import type { Product } from "../types";
import { markPendingProductAvailable, listPendingProducts, removeFromPending } from "../api/approval";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { TableState } from "../ui/TableState";
import { useToast } from "../ui/Toast";

type PendingAction = {
  kind: "approve" | "reject";
  product: Product;
};

export function PendingApprovalPage() {
  const { authorizedFetch } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPendingProducts = useCallback(async () => {
    setLoading(true);
    setTableError("");

    try {
      setProducts(await listPendingProducts(authorizedFetch));
    } catch (error) {
      const message = getErrorMessage(error);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, toast]);

  useEffect(() => {
    void loadPendingProducts();
  }, [loadPendingProducts]);

  const onConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    const { kind, product } = pendingAction;
    setSubmitting(true);

    try {
      if (kind === "approve") {
        await markPendingProductAvailable(authorizedFetch, product.product_id);
        await removeFromPending(authorizedFetch, product.product_id);
        toast.success("Продукт одобрен");
      } else {
        await removeFromPending(authorizedFetch, product.product_id);
        await deleteProduct(authorizedFetch, product.product_id);
        toast.success("Продукт отклонён");
      }
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      setSubmitting(false);
      setPendingAction(null);
      await loadPendingProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/95 p-6 shadow-lg shadow-slate-900/5">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">Approval queue</p>
          <h1 className="text-3xl font-semibold tracking-tight">На согласование</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Продукты, ожидающие проверки перед публикацией в каталоге.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Продукты на согласование</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0">
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Название</th>
                <th className="px-6 py-4">Описание</th>
                <th className="px-6 py-4">Категория</th>
                <th className="px-6 py-4">Цена</th>
                <th className="px-6 py-4 text-center">Действия</th>
              </tr>
            </thead>
            <TableState
              loading={loading}
              error={tableError}
              empty={products.length === 0}
              emptyMessage="Нет продуктов на согласование"
              colSpan={5}
            >
              {products.map((product) => (
                <tr key={product.product_id} className="border-t border-border/60 text-sm">
                  <td className="px-6 py-4 align-top font-medium text-foreground">{product.name}</td>
                  <td className="max-w-[320px] px-6 py-4 align-top text-muted-foreground">{product.description || "—"}</td>
                  <td className="px-6 py-4 align-top text-muted-foreground">{product.category || "—"}</td>
                  <td className="px-6 py-4 align-top">{product.price} руб</td>
                  <td className="px-6 py-4 align-top text-center">
                    <div className="flex flex-col justify-center gap-2 sm:flex-row">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        type="button"
                        disabled={submitting}
                        onClick={() => setPendingAction({ kind: "approve", product })}
                      >
                        Одобрить
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        type="button"
                        disabled={submitting}
                        onClick={() => setPendingAction({ kind: "reject", product })}
                      >
                        Отклонить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableState>
          </table>
        </div>
      </div>

      {pendingAction ? (
        <ConfirmDialog
          title={pendingAction.kind === "approve" ? "Одобрить продукт?" : "Отклонить продукт?"}
          onCancel={() => {
            if (!submitting) {
              setPendingAction(null);
            }
          }}
          onConfirm={onConfirmAction}
          confirmLabel={pendingAction.kind === "approve" ? "Одобрить" : "Отклонить"}
          confirmVariant={pendingAction.kind === "approve" ? "primary" : "danger"}
          confirming={submitting}
        >
          {pendingAction.kind === "approve" ? (
            <>
              Продукт <strong>{pendingAction.product.name}</strong> будет опубликован: сначала обновится статус
              доступности, затем он будет удален из очереди согласования.
            </>
          ) : (
            <>
              Продукт <strong>{pendingAction.product.name}</strong> будет удален из очереди согласования и из базы
              данных.
            </>
          )}
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
