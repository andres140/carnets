const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', requireAuth, dashboardController.index);
router.get('/dashboard/stats', requireAuth, dashboardController.stats);

module.exports = router;
