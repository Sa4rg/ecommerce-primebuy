/**
 * Button Component
 * 
 * Variants:
 * - primary: Orange filled button (main CTA)
 * - secondary: Border/outlined button
 * - ghost: Transparent with hover effect
 * 
 * Sizes: sm, md, lg
 */

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-pb-primary hover:bg-pb-primary-hover text-white shadow-sm",
  secondary: "border border-pb-border bg-white hover:bg-pb-bg-subtle text-pb-text",
  ghost: "text-pb-text-secondary hover:text-pb-text hover:bg-pb-surface-2",
  accent: "bg-pb-accent hover:bg-pb-accent-hover text-white shadow-sm",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-5 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-8 py-3 text-base rounded-full gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}) {
  return (
    <button
      className={cx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}) {
  return (
    <a
      href={href}
      className={cx(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </a>
  );
}
