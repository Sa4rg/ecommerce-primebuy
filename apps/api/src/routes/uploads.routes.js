const express = require("express");
const multer = require("multer");
const router = express.Router();

const uploadsController = require("../controllers/uploads.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// Multer en memoria (ideal para mandar buffer a Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB por imagen
});

// ✅ Admin: Subir imágenes de productos
router.post(
  "/products",
  requireAuth,
  requireRole("admin"),
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "gallery", maxCount: 12 },
  ]),
  uploadsController.uploadProductImages
);

// ✅ Usuario autenticado: Subir comprobante de pago
router.post(
  "/payments",
  requireAuth,
  upload.single("proof"),
  uploadsController.uploadPaymentProof
);

router.delete(
  "/",
  requireAuth,
  requireRole("admin"),
  express.json(),
  uploadsController.deleteImage
);

module.exports = router;