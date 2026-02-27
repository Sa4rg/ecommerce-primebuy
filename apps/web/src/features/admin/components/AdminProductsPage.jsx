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

function categoryBadgeClasses(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("computer")) return "bg-blue-500/10 text-blue-400";
  if (c.includes("audio")) return "bg-purple-500/10 text-purple-400";
  if (c.includes("access")) return "bg-indigo-500/10 text-indigo-400";
  if (c.includes("mobile") || c.includes("phone")) return "bg-emerald-500/10 text-emerald-400";
  return "bg-white/10 text-slate-300";
}

function sortList(list, sortKey) {
  const arr = [...list];
  if (sortKey === "price") return arr.sort((a, b) => Number(a.priceUSD) - Number(b.priceUSD));
  if (sortKey === "stock") return arr.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  return arr.sort((a, b) => {
    const an = String(a.nameES || a.nameEN || a.name || "");
    const bn = String(b.nameES || b.nameEN || b.name || "");
    return an.localeCompare(bn);
  });
}

function normalizeUrl(u) {
  const s = String(u || "").trim();
  if (!s) return "";
  return s;
}

function uniq(list) {
  const out = [];
  const seen = new Set();
  for (const x of list || []) {
    const v = String(x || "").trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function toUrl(x) {
  if (!x) return "";
  if (typeof x === "string") return x.trim();
  if (typeof x === "object") return String(x.url || "").trim();
  return String(x).trim();
}

const EMPTY = {
  id: "",
  nameES: "",
  nameEN: "",
  shortDescES: "",
  shortDescEN: "",
  priceUSD: "",
  stock: "",
  category: "",
  specs: [],

  // images
  imageUrl: "",
  imagePublicId: "",
  gallery: [], // array de urls string
};

export function AdminProductsPage() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const isEditing = Boolean(form?.id);

  // Catalog UI state
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ✅ Cloudinary uploads
  const [coverFile, setCoverFile] = useState(null);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);

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
    setCoverFile(null);
    setNewGalleryFiles([]);
    setForm(EMPTY);
  }

  function startEdit(p) {
    setError("");
    setCoverFile(null);
    setNewGalleryFiles([]);

    setForm({
      id: String(p.id),

      nameES: p.nameES ?? p.name ?? "",
      nameEN: p.nameEN ?? p.name ?? "",

      shortDescES: p.shortDescES ?? "",
      shortDescEN: p.shortDescEN ?? "",

      priceUSD: p.priceUSD ?? "",
      stock: p.stock ?? "",
      category: p.category ?? "",

      specs: Array.isArray(p.specs) ? p.specs : [],

      // ✅ images
      imageUrl: p.imageUrl ?? "",
      imagePublicId: p.imagePublicId ?? "",
      // ✅ gallery SIEMPRE urls
      gallery: Array.isArray(p.gallery) ? p.gallery.map(toUrl).filter(Boolean) : [],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Gallery editor
  function addGalleryRow() {
    setForm((prev) => ({ ...prev, gallery: [...(prev.gallery || []), ""] }));
  }

  function updateGalleryAt(idx, value) {
    setForm((prev) => {
      const g = [...(prev.gallery || [])];
      g[idx] = value;
      return { ...prev, gallery: g };
    });
  }

  function removeGalleryAt(idx) {
    setForm((prev) => {
      const g = [...(prev.gallery || [])];
      g.splice(idx, 1);
      return { ...prev, gallery: g };
    });
  }

  function useCoverAsFirst() {
    const cover = normalizeUrl(form.imageUrl);
    if (!cover) return;

    setForm((prev) => {
      const current = Array.isArray(prev.gallery) ? prev.gallery : [];
      const cleaned = current.map((u) => normalizeUrl(toUrl(u))).filter(Boolean);
      const next = uniq([cover, ...cleaned]);
      return { ...prev, imageUrl: cover, gallery: next };
    });
  }

  const formValid = useMemo(() => {
    const nameOk = String(form.nameES || "").trim().length > 0 || String(form.nameEN || "").trim().length > 0;
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

    // 1) subimos imágenes si hay archivos nuevos
    let uploaded = null;
    try {
      if (coverFile || (newGalleryFiles && newGalleryFiles.length > 0)) {
        uploaded = await adminProductsService.uploadImages({
          coverFile,
          galleryFiles: newGalleryFiles,
        });
      }
    } catch (eUp) {
      setError(eUp?.message || "Image upload failed");
      return;
    }

    // 2) resolvemos cover + gallery final
    const coverFromUpload = uploaded?.cover?.url || "";
    const galleryFromUpload = Array.isArray(uploaded?.gallery)
      ? uploaded.gallery.map((x) => toUrl(x)).filter(Boolean)
      : [];

    const cover = normalizeUrl(coverFromUpload || form.imageUrl);
    function isProbablyUrl(s) {
      const v = String(s || "").trim();
      return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("data:");
    }

    const galleryClean = uniq([
      ...((form.gallery || [])
        .map((x) => normalizeUrl(toUrl(x)))
        .filter((s) => s && isProbablyUrl(s))), // ✅ filtra basura
      ...galleryFromUpload.filter((s) => s && isProbablyUrl(s)),
    ]);

    // Si hay cover y no está en gallery, opcionalmente lo ponemos primero
    const finalGallery = cover ? uniq([cover, ...galleryClean]) : galleryClean;

    const payload = {
      nameES: String(form.nameES || "").trim(),
      nameEN: String(form.nameEN || "").trim(),
      shortDescES: String(form.shortDescES || "").trim(),
      shortDescEN: String(form.shortDescEN || "").trim(),

      priceUSD: Number(form.priceUSD),
      stock: Number(form.stock),
      category: String(form.category || "").trim() || "General",

      specs: Array.isArray(form.specs)
        ? form.specs
            .map((s) => ({
              labelES: String(s.labelES || "").trim(),
              valueES: String(s.valueES || "").trim(),
              labelEN: String(s.labelEN || "").trim(),
              valueEN: String(s.valueEN || "").trim(),
            }))
            .filter((s) => s.labelES || s.labelEN || s.valueES || s.valueEN)
        : [],

      // ✅ images
      imageUrl: cover || null,
      imagePublicId: uploaded?.cover?.publicId || form.imagePublicId || null,
      gallery: finalGallery,
    };

    setSaving(true);
    try {
      if (isEditing) {
        await adminProductsService.update(form.id, payload);
      } else {
        await adminProductsService.create(payload);
      }

      // reset
      setCoverFile(null);
      setNewGalleryFiles([]);
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
    const ok = window.confirm(`Delete "${p.nameES || p.nameEN || p.name}"? This cannot be undone.`);
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

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = Array.isArray(products) ? products : [];

    if (query) {
      list = list.filter((p) => {
        const name = String(p.nameES || p.nameEN || p.name || "").toLowerCase();
        const cat = String(p.category || "").toLowerCase();
        const id = String(p.id || "").toLowerCase();
        return name.includes(query) || cat.includes(query) || id.includes(query);
      });
    }

    return sortList(list, sortBy);
  }, [products, q, sortBy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  function onChangeSearch(v) {
    setQ(v);
    setPage(1);
  }

  function onChangeSort(v) {
    setSortBy(v);
    setPage(1);
  }

  // preview images
  const previewCover = useMemo(() => {
    const cover = normalizeUrl(form.imageUrl);
    if (cover) return cover;
    const g = Array.isArray(form.gallery) ? form.gallery.map((x) => normalizeUrl(toUrl(x))).filter(Boolean) : [];
    return g[0] || "";
  }, [form.imageUrl, form.gallery]);

  const previewGallery = useMemo(() => {
    const g = Array.isArray(form.gallery) ? form.gallery.map((x) => normalizeUrl(toUrl(x))).filter(Boolean) : [];
    const cover = normalizeUrl(form.imageUrl);
    return uniq([...(cover ? [cover] : []), ...g]).slice(0, 8);
  }, [form.imageUrl, form.gallery]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin · Products</h1>
        <p className="text-sm text-slate-400">Create, edit and delete products from the catalog.</p>
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
              value={form.nameES || form.nameEN || ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange("nameES", v);
                onChange("nameEN", v);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g. Sony A7 IV"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Name (ES)</label>
            <input
              value={form.nameES}
              onChange={(e) => onChange("nameES", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder='Ej: "Cámara Sony A7 IV"'
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Name (EN)</label>
            <input
              value={form.nameEN}
              onChange={(e) => onChange("nameEN", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder='E.g. "Sony A7 IV Camera"'
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Short description (ES)</label>
            <textarea
              value={form.shortDescES}
              onChange={(e) => onChange("shortDescES", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="2-3 líneas cortas..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">Short description (EN)</label>
            <textarea
              value={form.shortDescEN}
              onChange={(e) => onChange("shortDescEN", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="2-3 short lines..."
            />
          </div>

          {/* ✅ Cloudinary uploader */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Images (Cloudinary)</p>
                <p className="text-xs text-slate-400">Upload cover + gallery images.</p>
              </div>

              <button
                type="button"
                onClick={useCoverAsFirst}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              >
                Use cover as first
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="text-sm text-slate-300">Cover file</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full text-sm text-slate-300"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    If you upload a cover, it will replace the current one.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-300">Add gallery files</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setNewGalleryFiles(Array.from(e.target.files || []))}
                    className="mt-1 block w-full text-sm text-slate-300"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Uploaded images will be appended to gallery.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-300">Cover image URL (current)</label>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => onChange("imageUrl", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="https://.../cover.jpg"
                  />
                </div>
              </div>

              <div className="md:col-span-1">
                <div className="text-sm text-slate-300 mb-1">Preview</div>
                <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-square">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt="cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.opacity = "0.3")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">No cover</div>
                  )}
                </div>
              </div>
            </div>

            {/* Gallery URLs editor */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">Gallery URLs</label>
                <button
                  type="button"
                  onClick={addGalleryRow}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                >
                  + Add image URL
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {(form.gallery || []).length === 0 ? (
                  <div className="text-sm text-slate-500">No gallery images yet.</div>
                ) : (
                  (form.gallery || []).map((url, idx) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          value={url}
                          onChange={(e) => updateGalleryAt(idx, e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={`https://.../image-${idx + 1}.jpg`}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeGalleryAt(idx)}
                        className="rounded-xl bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-5">
                <div className="text-sm text-slate-300 mb-2">Gallery preview</div>
                {previewGallery.length === 0 ? (
                  <div className="text-sm text-slate-500">No images to preview.</div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {previewGallery.map((src) => (
                      <div
                        key={src}
                        className="rounded-lg overflow-hidden border border-white/10 bg-black/30 aspect-square"
                        title={src}
                      >
                        <img
                          src={src}
                          alt="gallery preview"
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.opacity = "0.3")}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specs editor */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">Technical specs</label>

              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    specs: [...(prev.specs || []), { labelES: "", valueES: "", labelEN: "", valueEN: "" }],
                  }))
                }
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
              >
                + Add spec
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(form.specs || []).length === 0 ? (
                <div className="text-sm text-slate-500">No specs yet.</div>
              ) : (
                (form.specs || []).map((s, idx) => (
                  <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        value={s.labelES || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const specs = [...(prev.specs || [])];
                            specs[idx] = { ...specs[idx], labelES: v };
                            return { ...prev, specs };
                          });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Label ES (Ej: Sensor)"
                      />

                      <input
                        value={s.valueES || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const specs = [...(prev.specs || [])];
                            specs[idx] = { ...specs[idx], valueES: v };
                            return { ...prev, specs };
                          });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Value ES"
                      />

                      <input
                        value={s.labelEN || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const specs = [...(prev.specs || [])];
                            specs[idx] = { ...specs[idx], labelEN: v };
                            return { ...prev, specs };
                          });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Label EN (e.g. Sensor)"
                      />

                      <input
                        value={s.valueEN || ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((prev) => {
                            const specs = [...(prev.specs || [])];
                            specs[idx] = { ...specs[idx], valueEN: v };
                            return { ...prev, specs };
                          });
                        }}
                        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:ring-1 focus:ring-orange-500"
                        placeholder="Value EN"
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => {
                            const specs = [...(prev.specs || [])];
                            specs.splice(idx, 1);
                            return { ...prev, specs };
                          });
                        }}
                        className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
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

      {/* Catalog */}
      <section id="catalog-section">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Catalog</h2>

            <button
              type="button"
              onClick={load}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl group"
              aria-label="Refresh"
              title="Refresh"
            >
              <svg className="h-5 w-5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <div className="p-6 bg-white/[0.02] border-b border-white/10 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>

              <input
                value={q}
                onChange={(e) => onChangeSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                placeholder="Search products..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => onChangeSort(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
              </select>
            </div>
          </div>

          {status === "loading" && <div className="p-6 text-slate-300/80">Loading products...</div>}

          {status === "error" && (
            <div className="p-6">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="font-bold text-red-200">Error</p>
                <p className="text-red-200/80">{error || "Failed to load products"}</p>
              </div>
            </div>
          )}

          {status !== "loading" && status !== "error" && total === 0 && <div className="p-6 text-slate-300">No products found.</div>}

          {status !== "loading" && status !== "error" && total > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider border-b border-white/10 bg-white/[0.01]">
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium">Product</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                      <th className="px-6 py-4 font-medium">Price</th>
                      <th className="px-6 py-4 font-medium">Stock</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {pageItems.map((p) => {
                      const img = p.imageUrl || (Array.isArray(p.gallery) ? toUrl(p.gallery[0]) : "");
                      return (
                        <tr key={p.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-6 py-4 text-slate-500 text-sm">{`#EV-${String(p.id).padStart(4, "0")}`}</td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg border border-white/10 bg-black/30 overflow-hidden shrink-0">
                                {img ? (
                                  <img
                                    src={img}
                                    alt="thumb"
                                    className="h-full w-full object-cover"
                                    onError={(e) => (e.currentTarget.style.opacity = "0.3")}
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium truncate">{p.nameES || p.nameEN || p.name}</div>
                                <div className="text-xs text-slate-500 truncate">{p.nameEN || ""}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={["px-2 py-1 rounded-md text-xs font-medium", categoryBadgeClasses(p.category)].join(" ")}>
                              {p.category || "General"}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-slate-300 font-mono">{formatUSD(p.priceUSD)}</td>

                          <td className="px-6 py-4">
                            <span className={Number(p.stock || 0) > 0 ? "text-emerald-400" : "text-slate-500"}>{Number(p.stock || 0)}</span>
                          </td>

                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => startEdit(p)}
                              className="px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white transition-all text-xs font-semibold"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(p)}
                              disabled={deletingId === String(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold disabled:opacity-60"
                            >
                              {deletingId === String(p.id) ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 border-t border-white/10 flex justify-between items-center text-sm text-slate-500">
                <span>
                  Showing {Math.min(start + pageItems.length, total)} of {total} products
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}