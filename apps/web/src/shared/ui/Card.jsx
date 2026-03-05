/**
 * Card Component
 * 
 * A surface container with border, background, and optional shadow.
 * 
 * Variants:
 * - default: Light surface
 * - subtle: Slightly darker bg
 * - bordered: With visible border
 * - featured: With primary accent border
 */

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

const baseStyles = "rounded-2xl transition-all duration-200";

const variants = {
  default: "bg-white border border-pb-border-light",
  subtle: "bg-pb-bg-subtle border border-pb-border-light",
  bordered: "bg-white border border-pb-border",
  featured: "bg-white border border-pb-primary/20",
};

export function Card({
  variant = "default",
  hover = false,
  shadow = false,
  className,
  children,
  ...props
}) {
  return (
    <div
      className={cx(
        baseStyles,
        variants[variant],
        hover && "hover:shadow-lg hover:border-pb-border cursor-pointer",
        shadow && "pb-shadow",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cx("px-6 py-4 border-b border-pb-border-light", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return (
    <div className={cx("p-6", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }) {
  return (
    <div className={cx("px-6 py-4 border-t border-pb-border-light", className)}>
      {children}
    </div>
  );
}
