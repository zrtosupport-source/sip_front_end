import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-sm border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-paper-100 placeholder:text-paper-500 focus:border-brass-500 ${className}`}
        {...props}
      />
    );
  },
);