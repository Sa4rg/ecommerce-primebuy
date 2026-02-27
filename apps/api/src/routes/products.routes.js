const express = require("express");
const router = express.Router();

const productsController = require("../controllers/products.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

// debug útil
console.log("productsController keys:", Object.keys(productsController));
console.log("typeof requireAuth:", typeof requireAuth);
console.log("typeof requireRole:", typeof requireRole);

router.get("/", productsController.listProducts);
router.get("/:id", productsController.getProductById);

router.post("/", requireAuth, requireRole("admin"), productsController.createProduct);
router.put("/:id", requireAuth, requireRole("admin"), productsController.updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), productsController.deleteProduct);

module.exports = router;