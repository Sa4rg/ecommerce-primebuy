const express = require("express");
const multer = require("multer");
const router = express.Router();

const uploadsController = require("../controllers/uploads.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");
const { AppError } = require("../utils/errors");

// Whitelist of allowed MIME types for image uploads
const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Multer en memoria (ideal para mandar buffer a Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB por imagen
  fileFilter: (req, file, cb) => {
    // Validate MIME type (first layer of defense)
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(
        new AppError(
          `Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP allowed`,
          400
        ),
        false
      );
    }
    cb(null, true);
  },
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