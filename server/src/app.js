const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const passport = require('./config/passport');
const { securityMiddleware } = require('./middleware/securityMiddleware');

const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicRoutes = require('./routes/academicRoutes');
const aiAnalyticsRoutes = require('./routes/aiAnalyticsRoutes');
const activityRoutes = require('./routes/activityRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const importRoutes = require('./routes/importRoutes');

const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');

const createApp = () => {
  const app = express();
  app.set('trust proxy', 1);

  const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.FRONTEND_URLS || '').split(','),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed =
        normalizedOrigin.includes('vercel.app') ||
        normalizedOrigin.includes('localhost') ||
        configuredOrigins.includes(normalizedOrigin);

      if (isAllowed) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  }));
  app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT || '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT || '1mb' }));
  app.use(cookieParser());
  app.use(morgan(process.env.NODE_ENV === 'test' ? 'tiny' : 'dev'));
  app.use(passport.initialize());
  app.use(securityMiddleware);

  app.use('/api/auth', authRoutes);
  app.use('/api/auth', googleAuthRoutes);
  app.use('/api/students', studentRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/performance', performanceRoutes);
  app.use('/api/subjects', subjectRoutes);
  app.use('/api/academic', academicRoutes);
  app.use('/api/ai-analytics', aiAnalyticsRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/faculty', facultyRoutes);
  app.use('/api/import', importRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running' });
  });

  app.get('/api/healthz', (_req, res) => {
    res.json({
      success: true,
      service: 'spid-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      dbConnected: mongoose.connection.readyState === 1,
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  });

  return app;
};

module.exports = { createApp };
