import type { ReactNode } from "react";
import { cn } from "../lib/utils";

type FieldProps = {
  children: ReactNode;
  error?: string;
  className?: string;
  hint?: string;
  htmlFor: string;
  label: ReactNode;
  labelHidden?: boolean;
  required?: boolean;
};

export function Field({ children, className, error, hint, htmlFor, label, labelHidden = false, required }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <label className={cn("text-sm font-medium leading-none", labelHidden && "sr-only")} htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
