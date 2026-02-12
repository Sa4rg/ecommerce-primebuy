const express = require('express');
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { requireCartMutatorAccess } = require("../middlewares/cart-mutator-access.middleware");

// Public
router.post("/", cartController.createCart);
router.get("/:cartId", cartController.getCart);

// Mutations require access
router.post("/:cartId/items", requireCartMutatorAccess(), cartController.addItem);
router.patch("/:cartId/items/:productId", requireCartMutatorAccess(), cartController.updateItem);
router.delete("/:cartId/items/:productId", requireCartMutatorAccess(), cartController.removeItem);
router.patch("/:cartId/metadata", requireCartMutatorAccess(), cartController.updateMetadata);

module.exports = router;
