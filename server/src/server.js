require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const passport = require('./config/passport');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/authRoutes');
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const studentRoutes = require('./routes/studentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicRoutes = require('./routes/academicRoutes');
const aiAnalyticsRoutes = require('./routes/aiAnalyticsRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();

// Connect to database (non-blocking)
connectDB();

const normalizeOrigin = (value) => (value || '').trim().replace(/\/+$/, '');
const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.FRONTEND_URLS || '').split(',')
]
  .map(normalizeOrigin)
  .filter(Boolean);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = normalizeOrigin(origin);
    const isAllowed =
      normalizedOrigin.includes('vercel.app') ||
      normalizedOrigin.includes('localhost') ||
      configuredOrigins.includes(normalizedOrigin);

    if (isAllowed) {
      return callback(null, true);
    }

    // Do not throw an error here; return false so disallowed origins are blocked
    // by the browser without turning the API response into a 500.
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/ai-analytics', aiAnalyticsRoutes);
app.use('/api/activities', activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${configuredOrigins.join(', ') || 'vercel.app, localhost'}`);
});
