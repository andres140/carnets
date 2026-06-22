const express = require('express');
const controller = require('../controllers/carnets.controller');

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:codigo/renovar', controller.renew);
router.patch('/:codigo/suspender', controller.suspend);
router.patch('/:codigo/revocar', controller.revoke);

module.exports = router;
