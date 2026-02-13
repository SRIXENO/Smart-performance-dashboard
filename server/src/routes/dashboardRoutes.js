const express = require('express');
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
  getRecentStudents
} = require('../controllers/dashboardController');

const router = express.Router();

// Remove auth middleware temporarily to test
router.get('/summary', getSummary);
router.get('/attendance-trend', getAttendanceTrend);
router.get('/grade-distribution', getGradeDistribution);
router.get('/subject-performance', getSubjectPerformance);
router.get('/at-risk-students', getAtRiskStudents);
router.get('/department-comparison', getDepartmentComparison);
router.get('/semester-distribution', getSemesterDistribution);
router.get('/attendance-heatmap', getAttendanceHeatmap);
router.get('/cgpa-distribution', getCGPADistribution);
router.get('/performance-growth', getPerformanceGrowth);
router.get('/difficult-subjects', getDifficultSubjects);
router.get('/attendance-performance-correlation', getAttendancePerformanceCorrelation);
router.get('/recent-students', getRecentStudents);

module.exports = router;