const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  getAcademicRecord,
  updateSemesterData,
  completeSemester,
  getYearWiseSGPA,
  getCGPATrend,
  getSubjectWiseGrades,
  getDepartmentRankings,
  getTopPerformers,
  getGradeStatistics
} = require('../controllers/academicController');

// Academic record routes
router.get(
  '/student/:studentId',
  authMiddleware,
  permissionMiddleware('students.view'),
  [param('studentId').isMongoId().withMessage('Invalid studentId')],
  validateRequest,
  getAcademicRecord
);
router.post(
  '/student/:studentId/semester',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    param('studentId').isMongoId().withMessage('Invalid studentId'),
    body('semester').isString().trim().isLength({ min: 1, max: 20 }).withMessage('semester is required'),
    body('year').isInt({ min: 1, max: 4 }).withMessage('year must be between 1 and 4'),
    body('subjects').isArray({ min: 1 }).withMessage('subjects must be a non-empty array'),
    body('subjects.*.subjectCode').optional().isString().trim().isLength({ min: 1, max: 20 }),
    body('subjects.*.subjectName').isString().trim().isLength({ min: 2, max: 120 }).withMessage('subjectName is required'),
    body('subjects.*.credits').isFloat({ min: 0, max: 10 }).withMessage('credits must be between 0 and 10'),
    body('subjects.*.marks').isFloat({ min: 0, max: 100 }).withMessage('marks must be between 0 and 100'),
    body('attendancePercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('attendancePercentage must be between 0 and 100'),
    body('status').optional().isIn(['in-progress', 'completed', 'failed']).withMessage('Invalid semester status'),
  ],
  validateRequest,
  updateSemesterData
);
router.put(
  '/student/:studentId/semester/complete',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    param('studentId').isMongoId().withMessage('Invalid studentId'),
    body('semester').isString().trim().isLength({ min: 1, max: 20 }).withMessage('semester is required'),
    body('year').isInt({ min: 1, max: 4 }).withMessage('year must be between 1 and 4'),
  ],
  validateRequest,
  completeSemester
);
router.get(
  '/student/:studentId/year-wise',
  authMiddleware,
  permissionMiddleware('students.view'),
  [param('studentId').isMongoId().withMessage('Invalid studentId')],
  validateRequest,
  getYearWiseSGPA
);
router.get(
  '/student/:studentId/cgpa-trend',
  authMiddleware,
  permissionMiddleware('students.view'),
  [param('studentId').isMongoId().withMessage('Invalid studentId')],
  validateRequest,
  getCGPATrend
);
router.get(
  '/student/:studentId/subjects',
  authMiddleware,
  permissionMiddleware('students.view'),
  [
    param('studentId').isMongoId().withMessage('Invalid studentId'),
    query('semester').optional().isString().trim().isLength({ min: 1, max: 20 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
  ],
  validateRequest,
  getSubjectWiseGrades
);

// Rankings and statistics
router.get(
  '/rankings/department/:department',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [param('department').isString().trim().isLength({ min: 2, max: 100 })],
  validateRequest,
  getDepartmentRankings
);
router.get(
  '/top-performers',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
  ],
  validateRequest,
  getTopPerformers
);
router.get(
  '/statistics',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [
    query('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
    query('semester').optional().isString().trim().isLength({ min: 1, max: 20 }),
  ],
  validateRequest,
  getGradeStatistics
);

module.exports = router;
