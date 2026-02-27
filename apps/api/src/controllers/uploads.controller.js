const { success } = require("../utils/response");
const { uploadBuffer, deleteByPublicId } = require("../services/cloudinary.service");

/**
 * POST /api/uploads/products
 * multipart/form-data
 * fields:
 *  - cover: file (opcional)
 *  - gallery: files[] (opcional)
 */
async function uploadProductImages(req, res, next) {
  try {
    const coverFile = req.files?.cover?.[0] || null;
    const galleryFiles = req.files?.gallery || [];

    const out = { cover: null, gallery: [] };

    if (coverFile?.buffer) {
      out.cover = await uploadBuffer(coverFile.buffer, { folder: "products" });
    }

    for (const f of galleryFiles) {
      if (!f?.buffer) continue;
      const uploaded = await uploadBuffer(f.buffer, { folder: "products" });
      out.gallery.push(uploaded);
    }

    return success(res, out, "Images uploaded");
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/uploads
 * body: { publicId: "..." }
 * (opcional, para borrar imágenes sueltas desde admin)
 */
async function deleteImage(req, res, next) {
  try {
    const { publicId } = req.body || {};
    if (!publicId) return success(res, { ok: true }, "No publicId");

    const result = await deleteByPublicId(publicId);
    return success(res, { ok: true, result }, "Image deleted");
  } catch (err) {
    return next(err);
  }
}

module.exports = { uploadProductImages, deleteImage };