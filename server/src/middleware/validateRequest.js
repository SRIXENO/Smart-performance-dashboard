const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const first = result.array({ onlyFirstError: true })[0];
  let message = first?.msg || 'Validation failed';
  if (message === 'Invalid value' && first?.param) {
    message = `Invalid ${first.param}`;
  }
  return res.status(400).json({
    success: false,
    error: message,
    details: result.array(),
  });
};

module.exports = validateRequest;
