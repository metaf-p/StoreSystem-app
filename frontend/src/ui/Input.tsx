import { useId, type InputHTMLAttributes } from "react";
import { Field } from "./Field";
import { buildControlId } from "../lib/form-id";
import { cn } from "../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  labelHidden?: boolean;
  wrapperClassName?: string;
  error?: string;
  hint?: string;
  label: string;
};

export function Input({
  className,
  error,
  hint,
  id,
  label,
  labelHidden = false,
  required,
  wrapperClassName,
  ...props
}: InputProps) {
  const fallbackId = useId().replace(/:/g, "");
  const resolvedId = buildControlId({
    explicitId: id,
    name: props.name,
    fallbackId: `field-${fallbackId}`,
  });

  return (
    <Field htmlFor={resolvedId} label={label} labelHidden={labelHidden} className={wrapperClassName} error={error} hint={hint} required={required}>
      <input
        id={resolvedId}
        required={required}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className,
        )}
        {...props}
      />
    </Field>
  );
}
