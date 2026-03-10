import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useTranslation } from "../i18n/useTranslation.js";
import PrimeBuyLogo from "../../assets/primebuy-logo-whitefont.png";
import { PRODUCT_CATEGORIES } from "../constants/productCategories.js";

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
      className="relative p-1.5 xs:p-2 text-slate-500 hover:text-pb-accent transition-colors"
      aria-label={label}
      title={label}
    >
      <span className="material-symbols-outlined text-[20px] xs:text-[22px]">
        shopping_cart
      </span>

      {count > 0 && (
        <span className="absolute top-0.5 right-0.5 bg-pb-primary text-white text-[10px] min-w-[16px] h-4 rounded-full px-1 flex items-center justify-center font-bold leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function LanguageToggle({ language, setLanguage }) {
  return (
    <div className="hidden sm:flex items-center gap-1 border border-pb-border rounded-full px-2 py-1 text-[11px] bg-pb-bg-subtle">
      <button
        type="button"
        onClick={() => setLanguage("es")}
        className={language === "es" ? "text-pb-primary font-bold" : "text-pb-muted hover:text-pb-text"}
      >
        ES
      </button>
      <span className="text-pb-border">|</span>
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={language === "en" ? "text-pb-primary font-bold" : "text-pb-muted hover:text-pb-text"}
      >
        EN
      </button>
    </div>
  );
}

function UserMenu({ isAuthenticated, role, onLogout, t }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useOnClickOutside(ref, () => setOpen(false));

  if (!isAuthenticated) {
    return (
      <Link
        to="/login"
        className={cx(
          "inline-flex items-center gap-2 rounded-full px-2.5 xs:px-3 py-1.5 xs:py-2 text-sm font-medium",
          "text-pb-text hover:bg-pb-bg-subtle border border-pb-border transition-colors"
        )}
      >
        <span className="material-symbols-outlined text-base xs:text-lg text-pb-muted">login</span>
        <span className="hidden xl:inline">{t("navbar.login")}</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-1.5 xs:gap-2 rounded-full px-2.5 xs:px-3 py-1.5 xs:py-2 text-sm font-medium",
          "text-pb-text hover:bg-pb-bg-subtle border border-pb-border transition-colors"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="material-symbols-outlined text-base xs:text-lg text-pb-muted">person</span>
        <span className="hidden xl:inline">{t("navbar.account")}</span>
        <span className="material-symbols-outlined text-sm xs:text-base text-pb-muted" aria-hidden>
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-pb-border bg-white pb-shadow-lg overflow-hidden z-50"
        >
          <div className="px-3 py-3 border-b border-pb-border-light">
            <p className="text-xs text-pb-muted">{t("navbar.account")}</p>
          </div>

          <div className="p-2">
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-text hover:bg-pb-bg-subtle"
            >
              <span className="material-symbols-outlined text-base text-pb-muted">person</span>
              {t("navbar.account")}
            </Link>

            <Link
              to="/products"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-text hover:bg-pb-bg-subtle"
            >
              <span className="material-symbols-outlined text-base text-pb-muted">storefront</span>
              {t("navbar.catalog")}
            </Link>

            {role === "admin" && (
              <>
                <Link
                  to="/admin/payments"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-accent hover:bg-pb-bg-subtle"
                >
                  <span className="material-symbols-outlined text-base">admin_panel_settings</span>
                  {t("navbar.admin")}
                </Link>

                <Link
                  to="/admin/products"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-accent hover:bg-pb-bg-subtle"
                >
                  <span className="material-symbols-outlined text-base">inventory_2</span>
                  {t("navbar.products")}
                </Link>

                <Link
                  to="/admin/fx"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-accent hover:bg-pb-bg-subtle"
                >
                  <span className="material-symbols-outlined text-base">currency_exchange</span>
                  FX
                </Link>
              </>
            )}

            <div className="my-2 border-t border-pb-border-light" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-pb-text hover:bg-pb-bg-subtle"
            >
              <span className="material-symbols-outlined text-base text-pb-muted">logout</span>
              {t("navbar.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({ isOpen, onClose, isAuthenticated, role, onLogout, t }) {
  const ref = useRef(null);
  useOnClickOutside(ref, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        className="fixed right-0 top-0 h-full w-72 xs:w-80 bg-white pb-shadow-lg overflow-y-auto"
      >
        <div className="p-4 border-b border-pb-border-light flex items-center justify-between">
          <span className="font-bold text-pb-text">Menu</span>
          <button onClick={onClose} className="p-2 hover:bg-pb-bg-subtle rounded-lg">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            to="/products"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle"
          >
            <span className="material-symbols-outlined text-pb-muted">storefront</span>
            {t("navbar.catalog")}
          </Link>

          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle"
          >
            <span className="material-symbols-outlined text-pb-muted">shopping_cart</span>
            {t("navbar.cart")}
          </Link>

          <button
            type="button"
            onClick={() => {
              onClose();
              setTimeout(() => {
                const el = document.getElementById("contact");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }, 100);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle text-left"
          >
            <span className="material-symbols-outlined text-pb-muted">mail</span>
            {t("navbar.contact")}
          </button>

          {isAuthenticated ? (
            <>
              <Link
                to="/account"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle"
              >
                <span className="material-symbols-outlined text-pb-muted">person</span>
                {t("navbar.account")}
              </Link>

              {role === "admin" && (
                <>
                  <div className="border-t border-pb-border-light my-2" />
                  <p className="px-4 py-2 text-xs font-bold text-pb-muted uppercase">Admin</p>
                  <Link
                    to="/admin/payments"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-accent hover:bg-pb-bg-subtle"
                  >
                    <span className="material-symbols-outlined">admin_panel_settings</span>
                    {t("navbar.admin")}
                  </Link>
                  <Link
                    to="/admin/products"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-accent hover:bg-pb-bg-subtle"
                  >
                    <span className="material-symbols-outlined">inventory_2</span>
                    {t("navbar.products")}
                  </Link>
                </>
              )}

              <div className="border-t border-pb-border-light my-2" />
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-pb-error hover:bg-pb-bg-subtle"
              >
                <span className="material-symbols-outlined">logout</span>
                {t("navbar.logout")}
              </button>
            </>
          ) : (
            <>
              <div className="border-t border-pb-border-light my-2" />
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle"
              >
                <span className="material-symbols-outlined text-pb-muted">login</span>
                {t("navbar.login")}
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-pb-text hover:bg-pb-bg-subtle"
              >
                <span className="material-symbols-outlined text-pb-muted">person_add</span>
                {t("navbar.register")}
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}

function HomeCategorySubnav({ t }) {
  const items = PRODUCT_CATEGORIES.filter((c) => c.slug !== "all");

  return (
    <div className="border-t border-pb-border-light bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Home categories"
          className="flex items-center justify-start xs:justify-center gap-4 xs:gap-5 lg:gap-6 py-2.5 xs:py-3 overflow-x-auto md:overflow-visible"
        >
          {items.map((c) => (
            <Link
              key={c.slug}
              to={`/products?category=${encodeURIComponent(c.slug)}`}
              className={[
                "shrink-0",
                "text-[10px] xs:text-[11px] font-bold uppercase tracking-[0.18em] xs:tracking-[0.22em]",
                "text-pb-muted hover:text-pb-primary",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-pb-primary/30 rounded",
              ].join(" ")}
            >
              {t(c.tKey)}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAuth();
  const { startNewCart, initializeCart, status, cart } = useCart();
  const { t, language, setLanguage } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    await startNewCart();
    navigate("/", { replace: true });
  }

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = q.trim();

      if (next && location.pathname !== "/products") {
        navigate(`/products?q=${encodeURIComponent(next)}`);
        return;
      }

      if (location.pathname === "/products") {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          if (next) p.set("q", next);
          else p.delete("q");
          return p;
        }, { replace: true });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [q, location.pathname, navigate, setSearchParams]);

  function onSubmitSearch(e) {
    e.preventDefault();
  }

  useEffect(() => {
    if (status === "idle" && !cart) {
      initializeCart();
    }
  }, [status, cart, initializeCart]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-pb-border-light">
        <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 xs:h-16 sm:h-16 lg:h-20 items-center justify-between gap-2 xs:gap-3 sm:gap-4">
            {/* Left: Brand */}
            <Link to="/" className="flex items-center gap-1.5 xs:gap-2 group shrink-0 min-w-0">
              <img
                src={PrimeBuyLogo}
                alt="Prime Buy"
                className="h-7 xs:h-8 sm:h-9 lg:h-10 w-auto object-contain"
                loading="eager"
              />
              <span className="text-lg xs:text-xl sm:text-2xl font-bold tracking-tight leading-none">
                <span className="text-pb-text">Prime</span>
                <span className="text-pb-primary">Buy</span>
              </span>
            </Link>

            {/* Center: Search (desktop) */}
            <form
              onSubmit={onSubmitSearch}
              className="hidden lg:flex flex-1 max-w-md items-center bg-pb-bg-subtle border border-pb-border-light rounded-full px-4 py-2"
            >
              <span className="material-symbols-outlined text-pb-muted text-lg mr-2">search</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("navbar.searchPlaceholder")}
                className="w-full bg-transparent text-sm text-pb-text placeholder:text-pb-muted outline-none"
              />
              {q.trim() && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="ml-2 text-pb-muted hover:text-pb-text"
                  aria-label="Clear"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-2 shrink-0">
              {/* Search toggle */}
              <button
                type="button"
                className="lg:hidden p-1.5 xs:p-2 text-pb-muted hover:text-pb-accent transition-colors"
                onClick={() => setMobileSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-[20px] xs:text-[22px]">search</span>
              </button>

              <LanguageToggle language={language} setLanguage={setLanguage} />

              {/* Mobile language */}
              <button
                type="button"
                onClick={() => setLanguage(language === "es" ? "en" : "es")}
                className="sm:hidden px-1.5 py-1 text-[11px] font-bold text-pb-muted hover:text-pb-text"
              >
                {language.toUpperCase()}
              </button>

              <CartBadge label={t("navbar.cart")} />

              {/* Contact button */}
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("contact");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 xl:px-3 py-2 text-sm font-medium text-pb-text hover:text-pb-primary transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base xl:text-lg">mail</span>
                <span className="hidden xl:inline">{t("navbar.contact")}</span>
              </button>

              <div className="hidden md:block">
                <UserMenu
                  isAuthenticated={isAuthenticated}
                  role={role}
                  onLogout={handleLogout}
                  t={t}
                />
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                className="md:hidden p-1.5 xs:p-2 text-pb-muted hover:text-pb-text transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Menu"
              >
                <span className="material-symbols-outlined text-[20px] xs:text-[22px]">menu</span>
              </button>
            </div>
          </div>

          {/* Mobile search bar */}
          {mobileSearchOpen && (
            <div className="pb-3 xs:pb-4 lg:hidden">
              <form
                onSubmit={onSubmitSearch}
                className="flex items-center bg-pb-bg-subtle border border-pb-border-light rounded-full px-3 xs:px-4 py-2.5 xs:py-3"
              >
                <span className="material-symbols-outlined text-pb-muted text-lg mr-2">search</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("navbar.searchPlaceholder")}
                  className="w-full bg-transparent text-sm text-pb-text placeholder:text-pb-muted outline-none"
                  autoFocus
                />
                {q.trim() && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="ml-2 text-pb-muted hover:text-pb-text"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </header>

      {location.pathname === "/" && <HomeCategorySubnav t={t} />}

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
        role={role}
        onLogout={handleLogout}
        t={t}
      />
    </>
  );
}