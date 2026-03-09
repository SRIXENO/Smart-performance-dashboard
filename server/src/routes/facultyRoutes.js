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
    body('registerNumber').optional().isString().trim().isLength({ min: 2, max: 50 }),
    body('status').optional().isIn(['active', 'blocked']),
    body('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('designation').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().isString().trim().isLength({ min: 0, max: 1000 }),
    body('expertise').optional().isArray({ max: 20 }),
    body('expertise.*').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('profilePhoto').optional().isString().trim().isLength({ min: 1, max: 4000 }),
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
    body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isString().isLength({ min: 8, max: 128 }),
    body('registerNumber').optional({ values: 'falsy' }).isString().trim().isLength({ min: 2, max: 50 }),
    body('status').optional().isIn(['active', 'blocked']),
    body('department').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('designation').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().isString().trim().isLength({ min: 0, max: 1000 }),
    body('expertise').optional().isArray({ max: 20 }),
    body('expertise.*').optional().isString().trim().isLength({ min: 1, max: 80 }),
    body('profilePhoto').optional().isString().trim().isLength({ min: 1, max: 4000 }),
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
