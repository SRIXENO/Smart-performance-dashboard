const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { upload, previewPerformanceImport, commitPerformanceImport } = require('../controllers/importController');

const router = express.Router();

router.post(
  '/performance/preview',
  authMiddleware,
  roleMiddleware(['admin']),
  upload.single('file'),
  previewPerformanceImport
);

router.post(
  '/performance/commit',
  authMiddleware,
  roleMiddleware(['admin']),
  [
    body('rows').isArray({ min: 1 }).withMessage('rows must be a non-empty array'),
    body('partial').optional().isBoolean(),
  ],
  validateRequest,
  commitPerformanceImport
);

module.exports = router;
