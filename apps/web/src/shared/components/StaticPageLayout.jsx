import { Link } from "react-router-dom";

export function StaticPageLayout({ title, children }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/" className="hover:text-orange-400 transition-colors">
          Home
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-100 font-medium">{title}</span>
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-slate-100">{title}</h1>
        <div className="mt-6 text-slate-300 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </main>
  );
}