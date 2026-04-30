import { createContext, useCallback, useContext, useMemo } from "react";
import { toast, Toaster } from "sonner";

type ToastType = "success" | "danger" | "info";

type ToastContextValue = {
  danger: (message: string) => void;
  info: (message: string) => void;
  success: (message: string) => void;
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback((message: string, type: ToastType = "success") => {
    if (type === "danger") {
      toast.error(message);
      return;
    }
    if (type === "info") {
      toast.info(message);
      return;
    }
    toast.success(message);
  }, []);

  const value = useMemo(
    () => ({
      danger: (message: string) => show(message, "danger"),
      info: (message: string) => show(message, "info"),
      success: (message: string) => show(message, "success"),
      show,
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "rounded-2xl border border-border bg-background text-foreground shadow-2xl",
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
