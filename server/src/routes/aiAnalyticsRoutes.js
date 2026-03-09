const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  getStudentAnalytics,
  batchAnalyzeStudents,
  getAtRiskStudentsAI,
  getDashboardInsights
} = require('../controllers/aiAnalyticsController');

// AI Analytics routes
router.get(
  '/student/:studentId',
  authMiddleware,
  permissionMiddleware('students.view'),
  [param('studentId').isMongoId().withMessage('Invalid studentId')],
  validateRequest,
  getStudentAnalytics
);
router.post(
  '/batch-analyze',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [
    query('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
    query('limit').optional().isInt({ min: 1, max: 500 }),
  ],
  validateRequest,
  batchAnalyzeStudents
);
router.get(
  '/at-risk',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [
    query('limit').optional().isInt({ min: 1, max: 200 }),
    query('riskLevel').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  validateRequest,
  getAtRiskStudentsAI
);
router.get('/dashboard-insights', authMiddleware, permissionMiddleware('dashboard.view'), getDashboardInsights);

module.exports = router;
