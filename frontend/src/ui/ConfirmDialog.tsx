import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  cancelLabel?: string;
  children: ReactNode;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary" | "outline-danger" | "outline-secondary";
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
};

export function ConfirmDialog({
  cancelLabel = "Отмена",
  children,
  confirmLabel = "Подтвердить",
  confirmVariant = "danger",
  confirming = false,
  onCancel,
  onConfirm,
  title,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px]" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-0 shadow-2xl outline-none">
          <div className="border-b border-border px-5 py-4">
            <AlertDialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">{title}</AlertDialogPrimitive.Title>
          </div>
          <div className="px-5 py-5">
            <div className="mb-5 text-sm text-muted-foreground">{children}</div>
            <div className="flex justify-end gap-3">
              <Button variant="outline-secondary" onClick={onCancel}>
                {cancelLabel}
              </Button>
              <Button variant={confirmVariant} onClick={onConfirm} disabled={confirming}>
                {confirming ? "Выполняется..." : confirmLabel}
              </Button>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
