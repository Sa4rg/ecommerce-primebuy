const express = require('express');

const router = express.Router();

router.use('/products', require('./products.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/checkout', require('./checkout.routes'));
router.use('/payments', require('./payments.routes'));

module.exports = router;