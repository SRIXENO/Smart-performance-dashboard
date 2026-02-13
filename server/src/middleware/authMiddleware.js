const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth middleware - Cookies:', req.cookies);
    const token = req.cookies.token;

    if (!token) {
      console.log('Auth middleware - No token found');
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.log('Auth middleware - Token verification failed:', error.message);
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = authMiddleware;