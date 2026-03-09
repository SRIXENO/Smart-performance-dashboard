const { hasPermission } = require('../utils/permissions');

const permissionMiddleware = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    if (!hasPermission(req.user, requiredPermission)) {
      return res.status(403).json({ success: false, error: `Missing permission: ${requiredPermission}` });
    }

    return next();
  };
};

module.exports = permissionMiddleware;
