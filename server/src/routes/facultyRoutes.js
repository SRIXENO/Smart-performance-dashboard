const express = require('express');
const { body, param, query } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { getFaculty, getFacultyInsights, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [
    query('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  ],
  validateRequest,
  getFaculty
);
router.get(
  '/insights',
  authMiddleware,
  permissionMiddleware('dashboard.view'),
  [query('department').optional().isString().trim().isLength({ min: 2, max: 100 })],
  validateRequest,
  getFacultyInsights
);
router.post(
  '/',
  authMiddleware,
  permissionMiddleware('faculty.manage'),
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8, max: 128 }),
    body('registerNumber').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 50 }).withMessage('registerNumber must be 2-50 characters'),
    body('status').optional({ values: 'falsy' }).isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
    body('department').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }).withMessage('department must be 2-100 characters'),
    body('designation').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }).withMessage('designation must be 2-100 characters'),
    body('bio').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 1000 }).withMessage('bio must be 1-1000 characters'),
    body('expertise').optional({ values: 'falsy' }).isArray({ max: 20 }).withMessage('expertise must be an array'),
    body('expertise.*').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 80 }).withMessage('expertise items must be 1-80 characters'),
    body('profilePhoto').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 4000 }).withMessage('profilePhoto must be 1-4000 characters'),
  ],
  validateRequest,
  createFaculty
);
router.put(
  '/:id',
  authMiddleware,
  permissionMiddleware('faculty.manage'),
  [
    param('id').isMongoId(),
    body('name').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }).withMessage('name must be 2-100 characters'),
    body('email').optional({ values: 'falsy' }).isEmail().normalizeEmail().withMessage('email must be valid'),
    body('password').optional({ values: 'falsy' }).isString().isLength({ min: 8, max: 128 }).withMessage('password must be 8-128 characters'),
    body('registerNumber').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 50 }).withMessage('registerNumber must be 2-50 characters'),
    body('status').optional({ values: 'falsy' }).isIn(['active', 'blocked']).withMessage('status must be active or blocked'),
    body('department').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }).withMessage('department must be 2-100 characters'),
    body('designation').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 100 }).withMessage('designation must be 2-100 characters'),
    body('bio').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 1000 }).withMessage('bio must be 1-1000 characters'),
    body('expertise').optional({ values: 'falsy' }).isArray({ max: 20 }).withMessage('expertise must be an array'),
    body('expertise.*').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 80 }).withMessage('expertise items must be 1-80 characters'),
    body('profilePhoto').optional({ values: 'falsy' }).isString().trim().isLength({ min: 1, max: 4000 }).withMessage('profilePhoto must be 1-4000 characters'),
  ],
  validateRequest,
  updateFaculty
);
router.delete(
  '/:id',
  authMiddleware,
  permissionMiddleware('faculty.manage'),
  [param('id').isMongoId()],
  validateRequest,
  deleteFaculty
);

module.exports = router;
