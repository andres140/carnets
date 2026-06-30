const express = require('express');
const validacionController = require('../controllers/validacion.controller');
const { qrValidationRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/validar/:token', qrValidationRateLimit, validacionController.validar);

module.exports = router;
