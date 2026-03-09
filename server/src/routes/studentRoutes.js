const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getStudents,
  getStudentById,
  getStudentProfile,
  getStudentSubjects,
  getStudentAnalytics,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUpdateStudentStatus,
  bulkPromoteStudents,
  exportStudents,
} = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const permissionMiddleware = require('../middleware/permissionMiddleware');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  permissionMiddleware('students.view'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
    query('semester').optional().isInt({ min: 1, max: 8 }),
    query('sortBy').optional().isIn(['createdAt', 'name', 'studentId', 'department', 'year', 'semester', 'status']),
    query('sortDir').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  getStudents
);
router.get(
  '/export',
  authMiddleware,
  permissionMiddleware('reports.export'),
  [
    query('year').optional().isInt({ min: 1, max: 4 }),
    query('semester').optional().isInt({ min: 1, max: 8 }),
    query('sortBy').optional().isIn(['createdAt', 'name', 'studentId', 'department', 'year', 'semester', 'status']),
    query('sortDir').optional().isIn(['asc', 'desc']),
  ],
  validateRequest,
  exportStudents
);
router.post(
  '/bulk/status',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    body('studentIds').optional().isArray(),
    body('studentIds.*').optional().isMongoId(),
    body('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('year').optional().isInt({ min: 1, max: 4 }),
    body('semester').optional().isInt({ min: 1, max: 8 }),
    body('fromStatus').optional().isIn(['active', 'inactive', 'graduated', 'suspended']),
    body('toStatus').isIn(['active', 'inactive', 'graduated', 'suspended']),
  ],
  validateRequest,
  bulkUpdateStudentStatus
);
router.post(
  '/bulk/promote-semester',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    body('studentIds').optional().isArray(),
    body('studentIds.*').optional().isMongoId(),
    body('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('year').optional().isInt({ min: 1, max: 4 }),
    body('semester').optional().isInt({ min: 1, max: 8 }),
    body('status').optional().isIn(['active', 'inactive', 'graduated', 'suspended']),
  ],
  validateRequest,
  bulkPromoteStudents
);
router.get('/:id/profile', authMiddleware, permissionMiddleware('students.view'), [param('id').isMongoId()], validateRequest, getStudentProfile);
router.get('/:id/subjects', authMiddleware, permissionMiddleware('students.view'), [param('id').isMongoId()], validateRequest, getStudentSubjects);
router.get('/:id/analytics', authMiddleware, permissionMiddleware('students.view'), [param('id').isMongoId()], validateRequest, getStudentAnalytics);
router.get('/:id', authMiddleware, permissionMiddleware('students.view'), [param('id').isMongoId()], validateRequest, getStudentById);
router.post(
  '/',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('department').isString().trim().isLength({ min: 2, max: 100 }),
    body('year').isInt({ min: 1, max: 4 }),
    body('password').isString().isLength({ min: 8, max: 128 }),
  ],
  validateRequest,
  createStudent
);
router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware('students.manage'),
  [
    param('id').isMongoId(),
    body('email').optional().isEmail().normalizeEmail(),
    body('year').optional().isInt({ min: 1, max: 4 }),
    body('semester').optional().isInt({ min: 1, max: 8 }),
    body('password').optional().isString().isLength({ min: 8, max: 128 }),
  ],
  validateRequest,
  updateStudent
);
router.delete('/:id', authMiddleware, permissionMiddleware('students.manage'), [param('id').isMongoId()], validateRequest, deleteStudent);

module.exports = router;
