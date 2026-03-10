const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolvePermissions } = require('../utils/permissions');

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
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ success: false, error: 'Invalid token type' });
    }
    const user = await User.findById(decoded.userId).select('userId name email registerNumber role status approvalStatus permissions');

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
      _id: user._id,
      userId: user._id,
      publicUserId: user.userId,
      name: user.name,
      email: user.email,
      registerNumber: user.registerNumber,
      role: user.role,
      permissions: resolvePermissions(user),
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
