const express = require('express');
const { body, param, cookie } = require('express-validator');
const {
  register,
  login,
  refresh,
  logout,
  me,
  getPendingApprovals,
  updateApprovalStatus,
  getViewers,
  updateViewerStatus,
  deleteViewer,
  updateUserPermissions,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const { authLimiter, loginLimiter } = require('../middleware/securityMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }).withMessage('name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('valid email is required'),
    body('password').isString().isLength({ min: 8, max: 128 }).withMessage('password must be 8-128 characters'),
  ],
  validateRequest,
  register
);
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isString().trim().isLength({ min: 2, max: 254 }).withMessage('email or login identifier is required'),
    body('password').isString().isLength({ min: 1, max: 256 }).withMessage('password is required'),
  ],
  validateRequest,
  login
);
router.post(
  '/refresh',
  [cookie('refresh_token').optional().isString().isLength({ min: 20, max: 2000 })],
  validateRequest,
  refresh
);
router.post(
  '/logout',
  [cookie('refresh_token').optional().isString().isLength({ min: 20, max: 2000 })],
  validateRequest,
  logout
);
router.get('/me', authMiddleware, me);
router.get('/approvals/pending', authMiddleware, permissionMiddleware('approvals.manage'), getPendingApprovals);
router.put(
  '/approvals/:id',
  authMiddleware,
  permissionMiddleware('approvals.manage'),
  [
    param('id').isMongoId().withMessage('invalid user id'),
    body('decision').isIn(['approved', 'rejected']).withMessage('decision must be approved or rejected'),
  ],
  validateRequest,
  updateApprovalStatus
);
router.get('/viewers', authMiddleware, permissionMiddleware('viewers.manage'), getViewers);
router.patch(
  '/viewers/:id/status',
  authMiddleware,
  permissionMiddleware('viewers.manage'),
  [
    param('id').isMongoId().withMessage('invalid viewer id'),
    body('status').isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
  ],
  validateRequest,
  updateViewerStatus
);
router.delete(
  '/viewers/:id',
  authMiddleware,
  permissionMiddleware('viewers.manage'),
  [param('id').isMongoId().withMessage('invalid viewer id')],
  validateRequest,
  deleteViewer
);
router.patch(
  '/users/:id/permissions',
  authMiddleware,
  permissionMiddleware('viewers.manage'),
  [
    param('id').isMongoId().withMessage('invalid user id'),
    body('permissions').isObject().withMessage('permissions object is required'),
  ],
  validateRequest,
  updateUserPermissions
);

module.exports = router;
