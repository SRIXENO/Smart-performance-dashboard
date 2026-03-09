const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getPerformance,
  createPerformance,
  updatePerformance,
  deletePerformance,
  getMissingPerformanceSummary,
  bootstrapMissingPerformance,
} = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  [
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('limit must be between 1 and 1000'),
    query('page').optional().isInt({ min: 1, max: 500 }).withMessage('page must be between 1 and 500'),
    query('studentId').optional().isMongoId().withMessage('Invalid studentId'),
    query('subjectId').optional().isMongoId().withMessage('Invalid subjectId'),
    query('search').optional().isString(),
    query('department').optional().isString(),
    query('subject').optional().isString(),
    query('sortBy').optional().isIn(['lastUpdated', 'studentName', 'subjectName', 'attendancePercentage', 'marks', 'grade', 'semester']),
    query('sortDir').optional().isIn(['asc', 'desc']),
    query('atRiskOnly').optional().isBoolean().withMessage('atRiskOnly must be boolean'),
  ],
  validateRequest,
  getPerformance
);
router.get(
  '/missing-summary',
  authMiddleware,
  roleMiddleware(['admin', 'faculty', 'viewer']),
  [query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('limit must be between 1 and 500')],
  validateRequest,
  getMissingPerformanceSummary
);
router.post(
  '/bootstrap-missing',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('studentIds').optional().isArray().withMessage('studentIds must be an array'),
    body('studentIds.*').optional().isMongoId().withMessage('Invalid studentId in studentIds'),
    body('dryRun').optional().isBoolean(),
    body('limit').optional().isInt({ min: 1, max: 500 }),
    body('perStudentMaxSubjects').optional().isInt({ min: 1, max: 6 }),
    body('marks').optional().isFloat({ min: 0, max: 100 }),
    body('attendancePercentage').optional().isFloat({ min: 0, max: 100 }),
  ],
  validateRequest,
  bootstrapMissingPerformance
);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('studentId').isMongoId().withMessage('Valid studentId is required'),
    body('subjectId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid subjectId'),
    body('subjectName').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 120 }).withMessage('subjectName must be 2-120 characters'),
    body('attendancePercentage').isFloat({ min: 0, max: 100 }).withMessage('attendancePercentage must be 0-100'),
    body('marks').isFloat({ min: 0, max: 100 }).withMessage('marks must be 0-100'),
  ],
  validateRequest,
  createPerformance
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    param('id').isMongoId().withMessage('Invalid performance id'),
    body('subjectId').optional({ values: 'falsy' }).isMongoId().withMessage('Invalid subjectId'),
    body('attendancePercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('attendancePercentage must be 0-100'),
    body('marks').optional().isFloat({ min: 0, max: 100 }).withMessage('marks must be 0-100'),
    body().custom((value) => {
      const hasAny = Object.prototype.hasOwnProperty.call(value, 'subjectId')
        || Object.prototype.hasOwnProperty.call(value, 'attendancePercentage')
        || Object.prototype.hasOwnProperty.call(value, 'marks');
      if (!hasAny) throw new Error('At least one field is required: subjectId, attendancePercentage, or marks');
      return true;
    }),
  ],
  validateRequest,
  updatePerformance
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isMongoId().withMessage('Invalid performance id')],
  validateRequest,
  deletePerformance
);

module.exports = router;
