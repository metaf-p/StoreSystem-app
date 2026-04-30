import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        danger: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        warning: "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
        info: "bg-sky-500 text-white shadow-sm hover:bg-sky-600",
        light: "bg-muted text-foreground shadow-sm hover:bg-muted/80",
        dark: "bg-slate-900 text-slate-50 shadow-sm hover:bg-slate-800",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        "outline-primary": "border border-primary/30 bg-background text-primary hover:bg-primary/5",
        "outline-secondary": "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
        "outline-danger": "border border-destructive/30 bg-background text-destructive hover:bg-destructive/5",
        "outline-warning": "border border-amber-500/30 bg-background text-amber-700 hover:bg-amber-500/5",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-6",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: ButtonVariant;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    fullWidth = false,
    size,
    type = "button",
    variant,
    children,
    ...props
  },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
      {children}
    </button>
  );
});
