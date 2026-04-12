/**
 * Skeleton Loading Component
 * Generic skeleton loader for different UI elements
 */

export function Skeleton({ className = "", variant = "rectangular" }) {
  const variantClasses = {
    rectangular: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] ${variantClasses[variant]} ${className}`}
      style={{
        animation: "pulse 1.5s ease-in-out infinite, shimmer 2s linear infinite",
      }}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-pb-border p-4 space-y-4">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-square" variant="rectangular" />
      
      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4" variant="text" />
      
      {/* Price skeleton */}
      <Skeleton className="h-8 w-1/2" variant="text" />
      
      {/* Button skeleton */}
      <Skeleton className="h-10 w-full" variant="rectangular" />
    </div>
  );
}

export function ProductsGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
