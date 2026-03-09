const express = require('express');
const { body, param } = require('express-validator');
const { getPerformance, createPerformance, updatePerformance, deletePerformance } = require('../controllers/performanceController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', authMiddleware, getPerformance);
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
