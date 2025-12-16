const express = require('express');

const router = express.Router();

router.use('/products', require('./products.routes'));

module.exports = router;