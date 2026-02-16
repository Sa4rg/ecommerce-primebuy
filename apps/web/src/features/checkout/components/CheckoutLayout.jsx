import React from "react";

export function CheckoutLayout({ left, right }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">{left}</div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24">{right}</div>
        </div>
      </div>
    </div>
  );
}
