const express = require('express');
const router = express.Router();
const {
  getStudentAnalytics,
  batchAnalyzeStudents,
  getAtRiskStudentsAI,
  getDashboardInsights
} = require('../controllers/aiAnalyticsController');

// AI Analytics routes
router.get('/student/:studentId', getStudentAnalytics);
router.post('/batch-analyze', batchAnalyzeStudents);
router.get('/at-risk', getAtRiskStudentsAI);
router.get('/dashboard-insights', getDashboardInsights);

module.exports = router;
