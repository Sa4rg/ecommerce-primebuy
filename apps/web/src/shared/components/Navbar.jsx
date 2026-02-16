// src/shared/components/Navbar.jsx
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function CartBadge() {
  const { itemsCount } = useCart();
  const count = itemsCount ?? 0;

  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-white/5 transition-colors"
      aria-label="Cart"
      title="Cart"
    >
      <span className="text-lg">🛍️</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const { startNewCart } = useCart();

  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  async function handleLogout() {
    await logout();
    await startNewCart();
    navigate("/", { replace: true });
  }

  // Mantener input del navbar sincronizado si cambian params (back/forward, etc.)
  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  const showAuthLinks = useMemo(() => {
    return !["/login", "/register"].includes(location.pathname);
  }, [location.pathname]);

  // ✅ Filtra mientras escribes (debounce)
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim();

      // Solo redirigir al catálogo si hay algo que buscar
      if (next && location.pathname !== "/") {
        navigate(`/?q=${encodeURIComponent(next)}`);
        return;
      }

      // Si ya estás en /, actualiza el query param
      if (location.pathname === "/") {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set("q", next);
          else p.delete("q");
          return p;
        });
      }
    }, 250);

    return () => clearTimeout(t);
  }, [q, location.pathname, navigate, setSearchParams]);

  function onSubmitSearch(e) {
    e.preventDefault();
    // Ya filtra mientras escribes; Enter no necesita hacer nada extra.
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#221910]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="rounded-lg bg-orange-500 px-2 py-1 text-white font-bold">⚡</div>
              <span className="text-lg font-bold tracking-tight text-white">ElectroVar</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  classNames(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-orange-400" : "text-slate-200 hover:text-orange-400"
                  )
                }
              >
                Electrónica
              </NavLink>
              <a className="text-sm font-medium text-slate-200 hover:text-orange-400 transition-colors" href="#">
                Novedades
              </a>
              <a className="text-sm font-medium text-slate-200 hover:text-orange-400 transition-colors" href="#">
                Ofertas
              </a>
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <form
              onSubmit={onSubmitSearch}
              className="hidden sm:flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10"
            >
              <span className="text-slate-400 text-sm">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar productos..."
                className="w-40 md:w-64 bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
              />
            </form>

            <CartBadge />

            {isAuthenticated && (
              <Link
                to="/account"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 border border-white/10 transition-colors"
              >
                👤 <span className="hidden sm:inline">Account</span>
              </Link>
            )}

            {role === "admin" && (
              <Link
                to="/admin/payments"
                className="hidden sm:inline-flex items-center rounded-full px-3 py-2 text-sm font-bold text-fuchsia-300 hover:bg-white/5 border border-white/10 transition-colors"
              >
                Admin
              </Link>
            )}

            {showAuthLinks && (
              <>
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 border border-white/10 transition-colors"
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 border border-white/10 transition-colors"
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
