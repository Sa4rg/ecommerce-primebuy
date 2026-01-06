const express = require('express');
const router = express.Router();
const cartController = require("../controllers/cart.controller");

router.post("/", cartController.createCart);
router.get("/:cartId", cartController.getCart);

router.post("/:cartId/items", cartController.addItem);
router.patch("/:cartId/items/:productId", cartController.updateItem);
router.delete("/:cartId/items/:productId", cartController.removeItem);

module.exports = router;