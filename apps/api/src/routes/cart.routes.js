const express = require('express');
const router = express.Router();
const cartController = require("../controllers/cart.controller");

// Carritos son anónimos - no requieren autenticación
// El userId se asocia al carrito en checkout si el usuario está autenticado
router.post("/", cartController.createCart);
router.get("/:cartId", cartController.getCart);

router.post("/:cartId/items", cartController.addItem);
router.patch("/:cartId/items/:productId", cartController.updateItem);
router.delete("/:cartId/items/:productId", cartController.removeItem);

router.patch("/:cartId/metadata", cartController.updateMetadata);

module.exports = router;
