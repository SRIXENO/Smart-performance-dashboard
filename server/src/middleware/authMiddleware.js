const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('role status approvalStatus');

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Account is blocked' });
    }

    if (user.approvalStatus === 'pending' || user.approvalStatus === 'rejected') {
      return res.status(403).json({ success: false, error: 'Account is not approved' });
    }

    req.user = {
      userId: decoded.userId,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
