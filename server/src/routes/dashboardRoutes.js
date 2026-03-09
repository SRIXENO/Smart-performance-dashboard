const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const { 
  getSummary, 
  getAttendanceTrend, 
  getGradeDistribution, 
  getSubjectPerformance, 
  getAtRiskStudents,
  getDepartmentComparison,
  getSemesterDistribution,
  getAttendanceHeatmap,
  getCGPADistribution,
  getPerformanceGrowth,
  getDifficultSubjects,
  getAttendancePerformanceCorrelation,
  getRecentStudents,
  getAnalytics,
  getMetrics
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/analytics', authMiddleware, permissionMiddleware('dashboard.view'), getAnalytics);
router.get('/metrics', authMiddleware, permissionMiddleware('dashboard.view'), getMetrics);
router.get('/summary', authMiddleware, permissionMiddleware('dashboard.view'), getSummary);
router.get('/attendance-trend', authMiddleware, permissionMiddleware('dashboard.view'), getAttendanceTrend);
router.get('/grade-distribution', authMiddleware, permissionMiddleware('dashboard.view'), getGradeDistribution);
router.get('/subject-performance', authMiddleware, permissionMiddleware('dashboard.view'), getSubjectPerformance);
router.get('/at-risk-students', authMiddleware, permissionMiddleware('dashboard.view'), getAtRiskStudents);
router.get('/department-comparison', authMiddleware, permissionMiddleware('dashboard.view'), getDepartmentComparison);
router.get('/semester-distribution', authMiddleware, permissionMiddleware('dashboard.view'), getSemesterDistribution);
router.get('/attendance-heatmap', authMiddleware, permissionMiddleware('dashboard.view'), getAttendanceHeatmap);
router.get('/cgpa-distribution', authMiddleware, permissionMiddleware('dashboard.view'), getCGPADistribution);
router.get('/performance-growth', authMiddleware, permissionMiddleware('dashboard.view'), getPerformanceGrowth);
router.get('/difficult-subjects', authMiddleware, permissionMiddleware('dashboard.view'), getDifficultSubjects);
router.get('/attendance-performance-correlation', authMiddleware, permissionMiddleware('dashboard.view'), getAttendancePerformanceCorrelation);
router.get('/recent-students', authMiddleware, permissionMiddleware('dashboard.view'), getRecentStudents);

module.exports = router;
