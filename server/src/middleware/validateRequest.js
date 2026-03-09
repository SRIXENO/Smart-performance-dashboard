const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true })[0];
  return res.status(400).json({
    success: false,
    error: first?.msg || 'Validation failed',
    details: result.array(),
  });
};

module.exports = validateRequest;
