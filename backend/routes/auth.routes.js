const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validate');
const { loginRateLimit } = require('../middleware/rateLimit');
const { csrfProtection } = require('../middleware/csrf');
const passwordRecoveryRoutes = require('./passwordRecovery.routes');
const twoFactorAuthRoutes = require('./twoFactorAuth.routes');

const router = express.Router();

router.post('/login', loginRateLimit, csrfProtection, validateLogin, authController.login);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);

// Password recovery routes
router.use('/password-recovery', passwordRecoveryRoutes);

// Two-factor authentication routes
router.use('/2fa', twoFactorAuthRoutes);

module.exports = router;
