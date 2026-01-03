const express = require('express');
const router = express.Router();
const cartController = require("../controllers/cart.controller");

router.post("/", cartController.createCart);
router.get("/:cartId", cartController.getCart);

module.exports = router;