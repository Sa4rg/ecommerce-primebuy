// web/src/features/admin/components/AdminProductsPage.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { adminProductsService } from "../adminProductsService";
import { useTranslation } from "../../../shared/i18n/useTranslation";

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
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:")) return s;
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
  imageUrl: "",
  imagePublicId: "",
  gallery: [],
};

export function AdminProductsPage() {
  const { t, language } = useTranslation();

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);

  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [uploading, setUploading] = useState(false);

  // File input refs
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const isEditing = Boolean(form?.id);

  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name | price | stock
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function load() {
    setStatus("loading");
    setError("");
    try {
      const list = await adminProductsService.list();
      setProducts(Array.isArray(list) ? list : []);
      setStatus("ready");
    } catch (e) {
      setStatus("error");
      setError(e?.message || t("adminProducts.errors.load"));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCreate() {
    setError("");
    setForm(EMPTY);
  }

  function startEdit(p) {
    setError("");
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

      imageUrl: p.imageUrl ?? "",
      imagePublicId: p.imagePublicId ?? "",
      gallery: Array.isArray(p.gallery) ? p.gallery : [],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addGalleryRow() {
    setForm((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), ""],
    }));
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
      const cleaned = current.map((u) => normalizeUrl(u)).filter(Boolean);
      const next = uniq([cover, ...cleaned]);
      return { ...prev, imageUrl: cover, gallery: next };
    });
  }

  // ✅ File Upload Handlers
  async function handleCoverFileSelect(file) {
    if (!file || uploading) return;
    setUploading(true);
    setError("");

    try {
      const result = await adminProductsService.uploadImages({ coverFile: file, galleryFiles: [] });
      if (result?.cover?.url) {
        onChange("imageUrl", result.cover.url);
        if (result.cover.publicId) {
          onChange("imagePublicId", result.cover.publicId);
        }
      }
    } catch (e) {
      setError(e?.message || t("adminProducts.errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryFilesSelect(files) {
    if (!files?.length || uploading) return;
    setUploading(true);
    setError("");

    try {
      const result = await adminProductsService.uploadImages({ coverFile: null, galleryFiles: Array.from(files) });
      if (result?.gallery?.length) {
        const urls = result.gallery.map((g) => g.url).filter(Boolean);
        setForm((prev) => ({
          ...prev,
          gallery: [...(prev.gallery || []), ...urls],
        }));
      }
    } catch (e) {
      setError(e?.message || t("adminProducts.errors.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  function handleCoverDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleCoverFileSelect(file);
    }
  }

  function handleGalleryDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files?.length) {
      const images = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (images.length) handleGalleryFilesSelect(images);
    }
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
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
      setError(t("adminProducts.errors.formInvalid"));
      return;
    }

    const cover = normalizeUrl(form.imageUrl);
    const galleryClean = uniq((form.gallery || []).map(normalizeUrl).filter(Boolean));

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

      imageUrl: cover || null,
      gallery: galleryClean,
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
      setError(e2?.message || t("adminProducts.errors.save"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(p) {
    if (deletingId) return;

    const display = p.nameES || p.nameEN || p.name || "";
    const ok = window.confirm(t("adminProducts.confirm.delete", { name: display }));
    if (!ok) return;

    setError("");
    setDeletingId(String(p.id));
    try {
      await adminProductsService.remove(p.id);
      await load();
    } catch (e) {
      setError(e?.message || t("adminProducts.errors.delete"));
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

  const previewCover = useMemo(() => {
    const cover = normalizeUrl(form.imageUrl);
    if (cover) return cover;
    const g = Array.isArray(form.gallery) ? form.gallery.map(normalizeUrl).filter(Boolean) : [];
    return g[0] || "";
  }, [form.imageUrl, form.gallery]);

  const previewGallery = useMemo(() => {
    const g = Array.isArray(form.gallery) ? form.gallery.map(normalizeUrl).filter(Boolean) : [];
    const cover = normalizeUrl(form.imageUrl);
    return uniq([...(cover ? [cover] : []), ...g]).slice(0, 8);
  }, [form.imageUrl, form.gallery]);

  const nameLabel = language === "es" ? t("adminProducts.form.nameES") : t("adminProducts.form.nameEN");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("adminProducts.title")}</h1>
        <p className="text-sm text-slate-400">{t("adminProducts.subtitle")}</p>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold">{isEditing ? t("adminProducts.form.editTitle") : t("adminProducts.form.createTitle")}</h2>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          >
            {t("adminProducts.actions.new")}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Quick name */}
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.nameQuick")}</label>
            <input
              value={form.nameES || form.nameEN || ""}
              onChange={(e) => {
                const v = e.target.value;
                onChange("nameES", v);
                onChange("nameEN", v);
              }}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.name")}
            />
            <p className="mt-2 text-xs text-slate-500">{t("adminProducts.form.help.nameQuick")}</p>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.nameES")}</label>
            <input
              value={form.nameES}
              onChange={(e) => onChange("nameES", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.nameES")}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.nameEN")}</label>
            <input
              value={form.nameEN}
              onChange={(e) => onChange("nameEN", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.nameEN")}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.shortDescES")}</label>
            <textarea
              value={form.shortDescES}
              onChange={(e) => onChange("shortDescES", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder={t("adminProducts.form.placeholders.shortDescES")}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.shortDescEN")}</label>
            <textarea
              value={form.shortDescEN}
              onChange={(e) => onChange("shortDescEN", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder={t("adminProducts.form.placeholders.shortDescEN")}
            />
          </div>

          {/* Images */}
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{t("adminProducts.images.title")}</p>
                <p className="text-xs text-slate-400">{t("adminProducts.images.subtitle")}</p>
              </div>

              <button
                type="button"
                onClick={useCoverAsFirst}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10"
                title={t("adminProducts.images.useCoverAsFirstTitle")}
              >
                {t("adminProducts.images.useCoverAsFirst")}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              {/* ✅ Cover Image Dropzone */}
              <div className="md:col-span-2">
                <label className="text-sm text-slate-300">{t("adminProducts.images.coverLabel")}</label>
                
                {/* Hidden file input */}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverFileSelect(file);
                    e.target.value = "";
                  }}
                />

                {/* Dropzone area */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  onDragOver={preventDefaults}
                  onDragEnter={preventDefaults}
                  onDragLeave={preventDefaults}
                  onDrop={handleCoverDrop}
                  className={`mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-all ${
                    uploading
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-white/20 bg-black/30 hover:border-orange-500/50 hover:bg-orange-500/5"
                  }`}
                >
                  {uploading ? (
                    <p className="text-sm text-orange-400">{t("adminProducts.images.uploading")}</p>
                  ) : (
                    <>
                      <span className="text-3xl">📷</span>
                      <p className="text-sm text-slate-400">{t("adminProducts.images.dropOrClick")}</p>
                      <p className="text-xs text-slate-500">{t("adminProducts.images.coverHelp")}</p>
                    </>
                  )}
                </div>

                {/* URL display (readonly) */}
                {form.imageUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={form.imageUrl}
                      readOnly
                      className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onChange("imageUrl", "")}
                      className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <div className="text-sm text-slate-300 mb-1">{t("adminProducts.images.preview")}</div>
                <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden aspect-square">
                  {previewCover ? (
                    <img
                      src={previewCover}
                      alt="cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.opacity = "0.3";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      {t("adminProducts.images.noCover")}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ Gallery Section with File Upload */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">{t("adminProducts.images.galleryLabel")}</label>

                {/* Hidden file input for gallery */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files?.length) handleGalleryFilesSelect(files);
                    e.target.value = "";
                  }}
                />

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  {uploading ? t("adminProducts.images.uploading") : t("adminProducts.images.addImage")}
                </button>
              </div>

              {/* Gallery dropzone */}
              <div
                onDragOver={preventDefaults}
                onDragEnter={preventDefaults}
                onDragLeave={preventDefaults}
                onDrop={handleGalleryDrop}
                className="mt-3 rounded-xl border-2 border-dashed border-white/10 bg-black/20 p-4 transition-all hover:border-orange-500/30"
              >
                {(form.gallery || []).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-slate-500">{t("adminProducts.images.emptyGallery")}</p>
                    <p className="text-xs text-slate-600 mt-1">{t("adminProducts.images.dropMultiple")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(form.gallery || []).map((url, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg border border-white/10 bg-black/30 overflow-hidden flex-shrink-0">
                          <img
                            src={normalizeUrl(url)}
                            alt={`gallery ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.opacity = "0.3";
                            }}
                          />
                        </div>

                        {/* URL (readonly) */}
                        <input
                          value={url}
                          readOnly
                          className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-400 outline-none truncate"
                        />

                        <button
                          type="button"
                          onClick={() => removeGalleryAt(idx)}
                          className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500 hover:text-white"
                          title={t("adminProducts.actions.remove")}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5">
                <div className="text-sm text-slate-300 mb-2">{t("adminProducts.images.galleryPreview")}</div>
                {previewGallery.length === 0 ? (
                  <div className="text-sm text-slate-500">{t("adminProducts.images.noPreview")}</div>
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
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0.3";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300">{t("adminProducts.specs.title")}</label>

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
                {t("adminProducts.specs.add")}
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(form.specs || []).length === 0 ? (
                <div className="text-sm text-slate-500">{t("adminProducts.specs.empty")}</div>
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
                        placeholder={t("adminProducts.specs.labelES")}
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
                        placeholder={t("adminProducts.specs.valueES")}
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
                        placeholder={t("adminProducts.specs.labelEN")}
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
                        placeholder={t("adminProducts.specs.valueEN")}
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
                        {t("adminProducts.actions.remove")}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300">{t("adminProducts.form.price")}</label>
            <input
              value={form.priceUSD}
              onChange={(e) => onChange("priceUSD", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.price")}
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">{t("adminProducts.form.stock")}</label>
            <input
              value={form.stock}
              onChange={(e) => onChange("stock", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.stock")}
              inputMode="numeric"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("adminProducts.form.category")}</label>
            <input
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={t("adminProducts.form.placeholders.category")}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-500/90 disabled:opacity-60"
            >
              {saving ? t("adminProducts.actions.saving") : isEditing ? t("adminProducts.actions.save") : t("adminProducts.actions.create")}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
              >
                {t("adminProducts.actions.cancel")}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Catalog */}
      <section id="catalog-section">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 sm:p-8 flex items-center justify-between border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">{t("adminProducts.catalog.title")}</h2>

            <button
              type="button"
              onClick={load}
              className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors rounded-xl group"
              aria-label={t("adminProducts.actions.refresh")}
              title={t("adminProducts.actions.refresh")}
            >
              <svg
                className="h-5 w-5 text-slate-400 group-hover:rotate-180 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
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
                placeholder={t("adminProducts.catalog.searchPlaceholder")}
                type="text"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400 whitespace-nowrap">{t("adminProducts.catalog.sortBy")}</label>
              <select
                value={sortBy}
                onChange={(e) => onChangeSort(e.target.value)}
                className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:ring-1 focus:ring-orange-500 outline-none"
              >
                <option value="name">{t("adminProducts.catalog.sort.name")}</option>
                <option value="price">{t("adminProducts.catalog.sort.price")}</option>
                <option value="stock">{t("adminProducts.catalog.sort.stock")}</option>
              </select>
            </div>
          </div>

          {status === "loading" && <div className="p-6 text-slate-300/80">{t("adminProducts.states.loading")}</div>}

          {status === "error" && (
            <div className="p-6">
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="font-bold text-red-200">{t("adminProducts.states.errorTitle")}</p>
                <p className="text-red-200/80">{error || t("adminProducts.errors.load")}</p>
              </div>
            </div>
          )}

          {status !== "loading" && status !== "error" && total === 0 && (
            <div className="p-6 text-slate-300">{t("adminProducts.states.empty")}</div>
          )}

          {status !== "loading" && status !== "error" && total > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-400 text-sm uppercase tracking-wider border-b border-white/10 bg-white/[0.01]">
                      <th className="px-6 py-4 font-medium">{t("adminProducts.table.id")}</th>
                      <th className="px-6 py-4 font-medium">{t("adminProducts.table.product")}</th>
                      <th className="px-6 py-4 font-medium">{t("adminProducts.table.category")}</th>
                      <th className="px-6 py-4 font-medium">{t("adminProducts.table.price")}</th>
                      <th className="px-6 py-4 font-medium">{t("adminProducts.table.stock")}</th>
                      <th className="px-6 py-4 font-medium text-right">{t("adminProducts.table.actions")}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {pageItems.map((p) => {
                      const img = p.imageUrl || (Array.isArray(p.gallery) ? p.gallery[0] : "");
                      const display = p.nameES || p.nameEN || p.name;
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
                                    onError={(e) => {
                                      e.currentTarget.style.opacity = "0.3";
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div className="min-w-0">
                                <div className="text-white font-medium truncate">{display}</div>
                                <div className="text-xs text-slate-500 truncate">{p.nameEN || ""}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={["px-2 py-1 rounded-md text-xs font-medium", categoryBadgeClasses(p.category)].join(" ")}>
                              {p.category || t("adminProducts.defaults.general")}
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
                              {t("adminProducts.actions.edit")}
                            </button>

                            <button
                              type="button"
                              onClick={() => onDelete(p)}
                              disabled={deletingId === String(p.id)}
                              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold disabled:opacity-60"
                            >
                              {deletingId === String(p.id) ? t("adminProducts.actions.deleting") : t("adminProducts.actions.delete")}
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
                  {t("adminProducts.pagination.showing", {
                    shown: Math.min(start + pageItems.length, total),
                    total,
                  })}
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    {t("adminProducts.pagination.prev")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                    className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30"
                  >
                    {t("adminProducts.pagination.next")}
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