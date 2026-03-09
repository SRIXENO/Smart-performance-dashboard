const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const createRateLimiter = (options = {}) => rateLimit({
  standardHeaders: true,
  legacyHeaders: false,
  ...options,
});

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 1200),
  message: { success: false, error: 'Too many requests. Please try again shortly.' },
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 40),
  message: { success: false, error: 'Too many authentication attempts. Try again in a few minutes.' },
});

const loginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX || 8),
  message: { success: false, error: 'Too many login attempts. Please wait 10 minutes.' },
});

const sanitizeObjectInPlace = (value, { replaceWith = '_' } = {}) => {
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const item of value) sanitizeObjectInPlace(item, { replaceWith });
    return;
  }

  for (const key of Object.keys(value)) {
    const current = value[key];
    const sanitizedKey = key.replace(/^\$|\./g, replaceWith);

    if (sanitizedKey !== key) {
      delete value[key];
      if (!['__proto__', 'constructor', 'prototype'].includes(sanitizedKey)) {
        value[sanitizedKey] = current;
      }
    }

    sanitizeObjectInPlace(value[sanitizedKey] ?? current, { replaceWith });
  }
};

const collapseDuplicateQueryValues = (value) => {
  if (!value || typeof value !== 'object') return;

  for (const key of Object.keys(value)) {
    const current = value[key];
    if (Array.isArray(current)) {
      value[key] = current[current.length - 1];
      continue;
    }
    if (current && typeof current === 'object') {
      collapseDuplicateQueryValues(current);
    }
  }
};

const requestHardeningMiddleware = (req, _res, next) => {
  sanitizeObjectInPlace(req.body);
  sanitizeObjectInPlace(req.params);
  sanitizeObjectInPlace(req.query);
  collapseDuplicateQueryValues(req.query);
  next();
};

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  requestHardeningMiddleware,
  apiLimiter,
];

module.exports = {
  securityMiddleware,
  authLimiter,
  loginLimiter,
};
