const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');

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

      if (req.user.role !== 'student') {
        req.user.role = 'student';
        await req.user.save();
      }
      
      const token = jwt.sign(
        { userId: req.user._id, role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      await ActivityLog.log({
        userId: req.user._id,
        userRole: 'student',
        userName: req.user.name,
        action: 'login',
        targetType: 'system',
        description: 'User logged in with Google OAuth',
        metadata: {
          email: req.user.email,
          loginMethod: 'google'
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'success'
      });
      
      console.log('Token created:', token);
      
      res.cookie('token', token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      console.log('Redirecting to frontend callback');
      res.redirect(`${frontendUrl}/auth/google-success?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${frontendUrl}/login?error=callback_failed`);
    }
  }
);

module.exports = router;
