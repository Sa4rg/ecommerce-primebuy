const express = require('express');

const router = express.Router();

router.use('/products', require('./products.routes'));
router.use('/cart', require('./cart.routes'));
router.use('/checkout', require('./checkout.routes'));
router.use('/payments', require('./payments.routes'));
router.use('/orders', require('./orders.routes'));
router.use('/auth', require('./auth.routes'));
router.use('/uploads', require('./uploads.routes'));
router.use('/me', require('./user.routes'));
router.use('/fx', require('./fx.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/voiceflow', require('./voiceflow.routes'));

module.exports = router;