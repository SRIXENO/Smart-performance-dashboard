const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=auth_failed` }),
  (req, res) => {
    try {
      console.log('Google callback - User:', req.user);
      
      if (!req.user) {
        console.error('No user in callback');
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_user`);
      }
      
      const token = jwt.sign(
        { userId: req.user._id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );
      
      console.log('Token created:', token);
      
      res.cookie('token', token, {
        expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax'
      });
      
      console.log('Redirecting to dashboard');
      res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=callback_failed`);
    }
  }
);

module.exports = router;
