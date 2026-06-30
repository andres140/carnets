const express = require('express');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');
const { loginRateLimit } = require('../middleware/rateLimit');
const { csrfProtection } = require('../middleware/csrf');
const passwordRecoveryRoutes = require('./passwordRecovery.routes');
const twoFactorAuthRoutes = require('./twoFactorAuth.routes');

const router = express.Router();

router.get('/csrf-token', authController.csrfToken);
router.post('/login', loginRateLimit, csrfProtection, validateLogin, authController.login);
router.post('/logout', requireAuth, csrfProtection, authController.logout);
router.get('/me', requireAuth, authController.me);

router.use('/password-recovery', passwordRecoveryRoutes);
router.use('/2fa', twoFactorAuthRoutes);

module.exports = router;
