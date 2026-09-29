import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brass-500 text-ink-950 hover:bg-brass-400 disabled:bg-brass-600/40 disabled:text-paper-500",
  secondary:
    "bg-ink-700 text-paper-100 hover:bg-ink-600 disabled:text-paper-500",
  danger:
    "bg-loss-600/20 text-loss-500 hover:bg-loss-600/30 disabled:text-paper-500",
  ghost:
    "bg-transparent text-paper-300 hover:text-paper-100 hover:bg-ink-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}