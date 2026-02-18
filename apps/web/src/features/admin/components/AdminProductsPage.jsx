// src/features/admin/components/AdminProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { adminProductsService } from "../adminProductsService";

function toNumberOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function formatUSD(n) {
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const EMPTY = { id: "", name: "", priceUSD: "", stock: "", category: "" };

export function AdminProductsPage() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const isEditing = Boolean(form?.id);

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const list = await adminProductsService.list();
      setProducts(Array.isArray(list) ? list : []);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Failed to load products");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setError("");
    setForm(EMPTY);
  }

  function startEdit(p) {
    setError("");
    setForm({
      id: String(p.id),
      name: p.name ?? "",
      priceUSD: p.priceUSD ?? "",
      stock: p.stock ?? "",
      category: p.category ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const formValid = useMemo(() => {
    const nameOk = String(form.name || "").trim().length > 0;
    const priceOk = toNumberOrNull(form.priceUSD) !== null;
    const stockOk = toNumberOrNull(form.stock) !== null;
    return nameOk && priceOk && stockOk;
  }, [form]);

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setError("");

    if (!formValid) {
      setError("Please fill name, priceUSD and stock.");
      return;
    }

    const payload = {
      name: String(form.name).trim(),
      priceUSD: Number(form.priceUSD),
      stock: Number(form.stock),
      category: String(form.category || "").trim() || "General",
      // inStock normalmente lo calcula backend, pero si lo acepta:
      // inStock: Number(form.stock) > 0,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await adminProductsService.update(form.id, payload);
      } else {
        await adminProductsService.create(payload);
      }
      setForm(EMPTY);
      await load();
    } catch (e2) {
      setError(e2?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p) {
    if (deletingId) return;
    const ok = window.confirm(`Delete "${p.name}"? This cannot be undone.`);
    if (!ok) return;

    setError("");
    setDeletingId(String(p.id));
    try {
      await adminProductsService.remove(p.id);
      await load();
    } catch (e) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin · Products</h1>
        <p className="text-sm text-slate-400">
          Create, edit and delete products from the catalog.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{isEditing ? "Edit product" : "Create product"}</h2>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            New
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Name</label>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Sony A7 IV"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Price (USD)</label>
            <input
              value={form.priceUSD}
              onChange={(e) => onChange("priceUSD", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="2499"
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Stock</label>
            <input
              value={form.stock}
              onChange={(e) => onChange("stock", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="10"
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Category</label>
            <input
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Cameras"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEditing ? "Save changes" : "Create product"}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">Catalog</h2>
          <button
            type="button"
            onClick={load}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            Refresh
          </button>
        </div>

        {status === "loading" && <p className="mt-4 text-slate-400">Loading...</p>}

        {status !== "loading" && products.length === 0 && (
          <p className="mt-4 text-slate-400">No products yet.</p>
        )}

        {products.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-300">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">ID</th>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Category</th>
                  <th className="py-3 pr-4">Price</th>
                  <th className="py-3 pr-4">Stock</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 text-slate-400">{p.id}</td>
                    <td className="py-3 pr-4 font-semibold">{p.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{p.category || "General"}</td>
                    <td className="py-3 pr-4 text-orange-400 font-bold">{formatUSD(p.priceUSD)}</td>
                    <td className="py-3 pr-4">{p.stock}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          disabled={deletingId === String(p.id)}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/20 disabled:opacity-60"
                        >
                          {deletingId === String(p.id) ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
