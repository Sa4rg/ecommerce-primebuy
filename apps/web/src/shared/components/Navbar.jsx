// web/src/shared/components/Navbar.jsx
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "../i18n/useTranslation.js";
import PrimeBuyLogo from "../../assets/primebuy-logo-whitefont.png";

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useOnClickOutside(ref, handler) {
  useEffect(() => {
    function onDown(e) {
      if (!ref.current) return;
      if (ref.current.contains(e.target)) return;
      handler(e);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [ref, handler]);
}

function CartBadge({ label }) {
  const { itemsCount } = useCart();
  const count = itemsCount ?? 0;

  return (
    <Link
      to="/cart"
      className="relative inline-flex items-center justify-center rounded-full p-2 hover:bg-white/5 transition-colors border border-white/10"
      aria-label={label}
      title={label}
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

function LanguageToggle({ language, setLanguage }) {
  return (
    <div className="hidden sm:flex items-center gap-1 border border-white/10 rounded-full px-2 py-1 text-xs bg-white/5">
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={language === "es" ? "text-orange-400 font-black" : "text-slate-300 hover:text-slate-100"}
      >
        ES
      </button>
      <span className="text-slate-600">|</span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={language === "en" ? "text-orange-400 font-black" : "text-slate-300 hover:text-slate-100"}
      >
        EN
      </button>
    </div>
  );
}

function UserMenu({
  isAuthenticated,
  role,
  onLogout,
  t,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold",
          "text-white hover:bg-white/5 border border-white/10 transition-colors"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span aria-hidden>👤</span>
        <span className="hidden md:inline">
          {isAuthenticated ? t("navbar.account") : t("navbar.login")}
        </span>
        <span className="material-symbols-outlined text-base opacity-70" aria-hidden>
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#1c140d]/95 backdrop-blur-md shadow-xl overflow-hidden"
        >
          <div className="px-3 py-3 border-b border-white/10">
            <p className="text-xs text-slate-400">
              {isAuthenticated ? t("navbar.account") : null}
            </p>
          </div>

          <div className="p-2">
            {isAuthenticated ? (
              <>
                <Link
                  to="/account"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-base">person</span>
                  {t("navbar.account")}
                </Link>

                {role === "admin" && (
                  <>
                    <Link
                      to="/admin/payments"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fuchsia-200 hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                      {t("navbar.admin")}
                    </Link>

                    <Link
                      to="/admin/products"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fuchsia-200 hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined text-base">inventory_2</span>
                      {t("navbar.products")}
                    </Link>

                    <Link
                      to="/admin/fx"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fuchsia-200 hover:bg-white/5"
                    >
                      <span className="material-symbols-outlined text-base">currency_exchange</span>
                      {t("fx")}
                    </Link>
                  </>
                )}

                <div className="my-2 border-t border-white/10" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  {t("navbar.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-base">login</span>
                  {t("navbar.login")}
                </Link>

                <Link
                  to="/register"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
                >
                  <span className="material-symbols-outlined text-base">person_add</span>
                  {t("navbar.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const { startNewCart } = useCart();
  const { t, language, setLanguage } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  async function handleLogout() {
    await logout();
    await startNewCart();
    navigate("/", { replace: true });
  }

  // Sync input when params change (back/forward)
  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = q.trim();

      if (next && location.pathname !== "/") {
        navigate(`/?q=${encodeURIComponent(next)}`);
        return;
      }

      if (location.pathname === "/") {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set("q", next);
          else p.delete("q");
          return p;
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q, location.pathname, navigate, setSearchParams]);

  function onSubmitSearch(e) {
    e.preventDefault();
    // debounce already handles it
  }

  const showSearch = useMemo(() => {
    // si luego quieres ocultarlo en /login /register lo puedes activar acá
    return true;
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#221910]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Brand */}
          <Link to="/" className="flex items-center gap-3 group">
              <img
                src={PrimeBuyLogo}
                alt="Prime Buy"
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                loading="eager"
              />
            <div className="leading-tight">
              <div className="text-white font-black tracking-tight text-base sm:text-lg">
                Prime Buy
              </div>
            </div>
          </Link>

          {/* Center: Search (desktop) */}
          {showSearch && (
            <form
              onSubmit={onSubmitSearch}
              className="hidden md:flex flex-1 max-w-xl items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10"
            >
              <span className="text-slate-400 text-sm">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("navbar.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-full px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/5"
                  aria-label={t("navbar.clearSearch")}
                  title={t("navbar.clearSearch")}
                >
                  ✕
                </button>
              )}
            </form>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search toggle */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center rounded-full p-2 hover:bg-white/5 transition-colors border border-white/10"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label={t("navbar.search")}
              title={t("navbar.search")}
            >
              <span className="material-symbols-outlined text-base">search</span>
            </button>

            <LanguageToggle language={language} setLanguage={setLanguage} />

              {/* Mobile language quick */}
              <button
                type="button"
                onClick={() => setLanguage(language === "es" ? "en" : "es")}
                className="sm:hidden inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/5 border border-white/10"
                title="Language"
              >
                {language.toUpperCase()}
              </button>

              {/* ✅ Contáctanos visible */}
              <Link
                to="/#contact"
                className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-slate-200 hover:bg-white/5 border border-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                {t("navbar.contact")}
              </Link>

              <CartBadge label={t("navbar.cart")} />

              <UserMenu
                isAuthenticated={isAuthenticated}
                role={role}
                onLogout={handleLogout}
                t={t}
              />
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && showSearch && (
          <div className="pb-3 md:hidden">
            <form
              onSubmit={onSubmitSearch}
              className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 border border-white/10"
            >
              <span className="text-slate-400 text-sm">🔎</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("navbar.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 outline-none"
                autoFocus
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="rounded-full px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/5"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </header>
  );
}