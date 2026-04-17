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

export function ProductsGridSkeleton({ count = 8, gridClassName = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" }) {
  return (
    <div className={gridClassName}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Cart Item Skeleton
 * Skeleton for shopping cart items
 */
export function CartItemSkeleton() {
  return (
    <div className="flex flex-col xxs:flex-row gap-3 xxs:gap-4 sm:gap-6 border border-pb-border rounded-xl p-3 xxs:p-4 bg-white">
      {/* Image */}
      <Skeleton className="w-full xxs:w-24 xs:w-28 sm:w-32 aspect-square flex-shrink-0" variant="rectangular" />
      
      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2 xxs:space-y-3">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <div className="flex items-center gap-3 pt-2">
          <Skeleton className="h-8 w-24" variant="rectangular" />
          <Skeleton className="h-8 w-20" variant="rectangular" />
        </div>
      </div>
      
      {/* Price */}
      <div className="flex xxs:flex-col items-end justify-between xxs:justify-start gap-2">
        <Skeleton className="h-6 w-20" variant="text" />
        <Skeleton className="h-8 w-8 xxs:mt-auto" variant="rectangular" />
      </div>
    </div>
  );
}

/**
 * Cart Summary Skeleton
 * Skeleton for cart summary sidebar
 */
export function CartSummarySkeleton() {
  return (
    <div className="rounded-2xl border border-pb-border bg-white p-4 xxs:p-5 xs:p-6 space-y-4">
      <Skeleton className="h-6 w-1/2 mb-4" variant="text" />
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-16" variant="text" />
        </div>
        <div className="border-t border-pb-border pt-3 flex justify-between">
          <Skeleton className="h-5 w-20" variant="text" />
          <Skeleton className="h-5 w-20" variant="text" />
        </div>
      </div>
      
      <Skeleton className="h-12 w-full mt-4" variant="rectangular" />
    </div>
  );
}

/**
 * Order Card Skeleton
 * Skeleton for order cards in account page
 */
export function OrderCardSkeleton() {
  return (
    <div className="border border-pb-border rounded-xl p-4 xs:p-5 bg-white">
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-32" variant="text" />
          <Skeleton className="h-4 w-48" variant="text" />
        </div>
        <Skeleton className="h-6 w-24" variant="rectangular" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-3/4" variant="text" />
      </div>
      
      <div className="mt-4 pt-4 border-t border-pb-border flex justify-between items-center">
        <Skeleton className="h-4 w-24" variant="text" />
        <Skeleton className="h-9 w-28" variant="rectangular" />
      </div>
    </div>
  );
}

/**
 * Payment Card Skeleton
 * Skeleton for payment cards in account page
 */
export function PaymentCardSkeleton() {
  return (
    <div className="border border-pb-border rounded-xl p-4 xs:p-5 bg-white">
      <div className="flex flex-col xs:flex-row xs:items-start xs:justify-between gap-3 mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-40" variant="text" />
          <Skeleton className="h-4 w-56" variant="text" />
        </div>
        <Skeleton className="h-6 w-28" variant="rectangular" />
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <Skeleton className="h-3 w-16 mb-1" variant="text" />
          <Skeleton className="h-4 w-24" variant="text" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
        </div>
      </div>
      
      <Skeleton className="h-9 w-full" variant="rectangular" />
    </div>
  );
}

/**
 * Order Detail Skeleton
 * Skeleton for order detail page
 */
export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" variant="text" />
        <div className="flex gap-3">
          <Skeleton className="h-6 w-32" variant="rectangular" />
          <Skeleton className="h-6 w-32" variant="rectangular" />
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="border border-pb-border rounded-xl p-5 bg-white space-y-4">
            <Skeleton className="h-6 w-32 mb-4" variant="text" />
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-4 pb-4 border-b border-pb-border last:border-0">
                <Skeleton className="w-20 h-20 flex-shrink-0" variant="rectangular" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" variant="text" />
                  <Skeleton className="h-4 w-1/2" variant="text" />
                </div>
                <Skeleton className="h-5 w-20" variant="text" />
              </div>
            ))}
          </div>
          
          {/* Shipping */}
          <div className="border border-pb-border rounded-xl p-5 bg-white space-y-3">
            <Skeleton className="h-6 w-40 mb-4" variant="text" />
            <Skeleton className="h-4 w-full" variant="text" />
            <Skeleton className="h-4 w-3/4" variant="text" />
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-pb-border rounded-xl p-5 bg-white space-y-4">
            <Skeleton className="h-6 w-32 mb-4" variant="text" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" variant="text" />
                  <Skeleton className="h-4 w-20" variant="text" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
