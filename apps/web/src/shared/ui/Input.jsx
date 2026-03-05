/**
 * Input Component
 * 
 * Styled input with label and error support.
 */

import { forwardRef } from "react";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const baseInputStyles = 
  "w-full px-4 py-2.5 rounded-lg border bg-white text-pb-text placeholder-pb-muted " +
  "focus:outline-none focus:ring-2 focus:ring-pb-accent/20 focus:border-pb-accent " +
  "transition-all duration-200 disabled:bg-pb-bg-subtle disabled:cursor-not-allowed";

const inputVariants = {
  default: "border-pb-border",
  error: "border-pb-error focus:ring-pb-error/20 focus:border-pb-error",
};

export const Input = forwardRef(function Input(
  { label, error, variant = "default", className, ...props },
  ref
) {
  const computedVariant = error ? "error" : variant;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-pb-text mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cx(baseInputStyles, inputVariants[computedVariant], className)}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-pb-error">{error}</p>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, variant = "default", className, rows = 4, ...props },
  ref
) {
  const computedVariant = error ? "error" : variant;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-pb-text mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cx(baseInputStyles, inputVariants[computedVariant], "resize-none", className)}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-pb-error">{error}</p>
      )}
    </div>
  );
});

export function SearchInput({ className, ...props }) {
  return (
    <div className="relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-pb-muted text-lg">
        search
      </span>
      <input
        type="text"
        className={cx(
          "w-full pl-10 pr-4 py-2 rounded-full border border-pb-border bg-pb-bg-subtle",
          "text-sm text-pb-text placeholder-pb-muted",
          "focus:outline-none focus:ring-2 focus:ring-pb-accent/20 focus:border-pb-accent",
          "transition-all duration-200",
          className
        )}
        {...props}
      />
    </div>
  );
}
