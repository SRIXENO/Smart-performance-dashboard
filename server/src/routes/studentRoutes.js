const express = require('express');
const { body, param, query } = require('express-validator');
const { getStudents, getStudentById, getStudentProfile, getStudentSubjects, getStudentAnalytics, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'faculty', 'viewer']),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('year').optional().isInt({ min: 1, max: 4 }),
  ],
  validateRequest,
  getStudents
);
router.get('/:id/profile', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), [param('id').isMongoId()], validateRequest, getStudentProfile);
router.get('/:id/subjects', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), [param('id').isMongoId()], validateRequest, getStudentSubjects);
router.get('/:id/analytics', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), [param('id').isMongoId()], validateRequest, getStudentAnalytics);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'faculty']), [param('id').isMongoId()], validateRequest, getStudentById);
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin']),
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
  roleMiddleware(['admin', 'faculty']),
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
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), [param('id').isMongoId()], validateRequest, deleteStudent);

module.exports = router;
