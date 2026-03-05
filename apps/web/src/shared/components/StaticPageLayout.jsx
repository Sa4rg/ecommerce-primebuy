import { Link } from "react-router-dom";

export function StaticPageLayout({ title, children }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-pb-text-secondary">
        <Link to="/" className="hover:text-pb-primary transition-colors">
          Home
        </Link>
        <span className="text-pb-text-secondary">/</span>
        <span className="text-pb-text font-medium">{title}</span>
      </nav>

      <div className="rounded-2xl border border-pb-border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-pb-text">{title}</h1>
        <div className="mt-6 text-pb-text-secondary leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </main>
  );
}