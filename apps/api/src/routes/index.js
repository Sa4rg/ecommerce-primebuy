const express = require('express');

const router = express.Router();

router.use('/products', require('./products.routes'));
router.use('/cart', require('./cart.routes'));

module.exports = router;