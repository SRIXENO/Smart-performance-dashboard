const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
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

router.get('/summary', authMiddleware, roleMiddleware(['admin', 'faculty']), getSummary);
router.get('/attendance-trend', authMiddleware, roleMiddleware(['admin', 'faculty']), getAttendanceTrend);
router.get('/grade-distribution', authMiddleware, roleMiddleware(['admin', 'faculty']), getGradeDistribution);
router.get('/subject-performance', authMiddleware, roleMiddleware(['admin', 'faculty']), getSubjectPerformance);
router.get('/at-risk-students', authMiddleware, roleMiddleware(['admin', 'faculty']), getAtRiskStudents);
router.get('/department-comparison', authMiddleware, roleMiddleware(['admin', 'faculty']), getDepartmentComparison);
router.get('/semester-distribution', authMiddleware, roleMiddleware(['admin', 'faculty']), getSemesterDistribution);
router.get('/attendance-heatmap', authMiddleware, roleMiddleware(['admin', 'faculty']), getAttendanceHeatmap);
router.get('/cgpa-distribution', authMiddleware, roleMiddleware(['admin', 'faculty']), getCGPADistribution);
router.get('/performance-growth', authMiddleware, roleMiddleware(['admin', 'faculty']), getPerformanceGrowth);
router.get('/difficult-subjects', authMiddleware, roleMiddleware(['admin', 'faculty']), getDifficultSubjects);
router.get('/attendance-performance-correlation', authMiddleware, roleMiddleware(['admin', 'faculty']), getAttendancePerformanceCorrelation);
router.get('/recent-students', authMiddleware, roleMiddleware(['admin', 'faculty']), getRecentStudents);

module.exports = router;
