const express = require('express');
const passport = require('../config/passport');
const { issueSessionTokens } = require('../utils/authTokens');
const { evaluateLoginAnomaly, logSuccessfulLogin } = require('../services/loginSecurityService');

const router = express.Router();

const normalizeUrl = (value) => (value || '').trim().replace(/\/+$/, '');
const frontendUrl =
  normalizeUrl(process.env.FRONTEND_URL) ||
  normalizeUrl((process.env.FRONTEND_URLS || '').split(',')[0]) ||
  'http://localhost:3000';
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${frontendUrl}/login?error=auth_failed` }),
  async (req, res) => {
    try {
      console.log('Google callback - User:', req.user);
      
      if (!req.user) {
        console.error('No user in callback');
        return res.redirect(`${frontendUrl}/login?error=no_user`);
      }

      if (req.user.status === 'blocked') {
        return res.redirect(`${frontendUrl}/login?error=account_blocked`);
      }

      if (req.user.approvalStatus === 'pending') {
        return res.redirect(`${frontendUrl}/login?error=approval_pending`);
      }

      if (req.user.approvalStatus === 'rejected') {
        return res.redirect(`${frontendUrl}/login?error=approval_rejected`);
      }
      
      const { accessToken } = await issueSessionTokens(req.user, req, res);

      const anomaly = await evaluateLoginAnomaly({
        user: req.user,
        identifier: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
      await logSuccessfulLogin({
        user: req.user,
        identifier: req.user.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        anomaly,
        loginMethod: 'google',
        description: 'User logged in with Google OAuth',
      });
      
      console.log('Redirecting to frontend callback');
      res.redirect(`${frontendUrl}/auth/google-success?token=${encodeURIComponent(accessToken)}`);
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  }
);

module.exports = router;
