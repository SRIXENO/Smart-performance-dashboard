const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  assignSubjects,
  getSubjectGroups,
  getSubjectGroupByDeptYear,
  getStudentSubjects,
  updateSubjectGroup,
  deleteSubjectGroup
} = require('../controllers/subjectController');

router.post(
  '/assign',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('department').isString().trim().isLength({ min: 2, max: 100 }).withMessage('department is required'),
    body('year').isInt({ min: 1, max: 4 }).withMessage('year must be between 1 and 4'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('semester must be between 1 and 8'),
    body('subjects').isArray({ min: 1 }).withMessage('subjects must be a non-empty array'),
    body('subjects.*.code').isString().trim().matches(/^[A-Za-z0-9-]{2,20}$/).withMessage('subject code must be 2-20 alphanumeric characters'),
    body('subjects.*.name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('subject name must be 2-120 characters'),
  ],
  validateRequest,
  assignSubjects
);
router.get('/', authMiddleware, getSubjectGroups);
router.get(
  '/department/:department/year/:year',
  authMiddleware,
  [
    param('department').isString().trim().isLength({ min: 2, max: 100 }),
    param('year').isInt({ min: 1, max: 4 }),
    query('semester').optional().isInt({ min: 1, max: 8 }).withMessage('semester must be between 1 and 8'),
  ],
  validateRequest,
  getSubjectGroupByDeptYear
);
router.get(
  '/student/:studentId',
  authMiddleware,
  [param('studentId').isString().trim().notEmpty().withMessage('studentId is required')],
  validateRequest,
  getStudentSubjects
);
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    param('id').isMongoId().withMessage('Invalid subject group id'),
    body('subjects').isArray({ min: 1 }).withMessage('subjects must be a non-empty array'),
    body('subjects.*.code').isString().trim().matches(/^[A-Za-z0-9-]{2,20}$/).withMessage('subject code must be 2-20 alphanumeric characters'),
    body('subjects.*.name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('subject name must be 2-120 characters'),
  ],
  validateRequest,
  updateSubjectGroup
);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  [param('id').isMongoId().withMessage('Invalid subject group id')],
  validateRequest,
  deleteSubjectGroup
);

module.exports = router;
