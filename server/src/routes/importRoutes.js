const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const { upload, previewPerformanceImport, commitPerformanceImport } = require('../controllers/importController');

const router = express.Router();

router.post(
  '/performance/preview',
  authMiddleware,
  permissionMiddleware('import.manage'),
  upload.single('file'),
  previewPerformanceImport
);

router.post(
  '/performance/commit',
  authMiddleware,
  permissionMiddleware('import.manage'),
  [
    body('rows').isArray({ min: 1 }).withMessage('rows must be a non-empty array'),
    body('partial').optional().isBoolean(),
  ],
  validateRequest,
  commitPerformanceImport
);

module.exports = router;
