const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

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

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
  mongoSanitize({
    allowDots: false,
    replaceWith: '_',
  }),
  hpp(),
  apiLimiter,
];

module.exports = {
  securityMiddleware,
  authLimiter,
  loginLimiter,
};
