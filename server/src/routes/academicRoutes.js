const express = require('express');
const router = express.Router();
const {
  getAcademicRecord,
  updateSemesterData,
  completeSemester,
  getYearWiseSGPA,
  getCGPATrend,
  getSubjectWiseGrades,
  getDepartmentRankings,
  getTopPerformers,
  getGradeStatistics
} = require('../controllers/academicController');

// Academic record routes
router.get('/student/:studentId', getAcademicRecord);
router.post('/student/:studentId/semester', updateSemesterData);
router.put('/student/:studentId/semester/complete', completeSemester);
router.get('/student/:studentId/year-wise', getYearWiseSGPA);
router.get('/student/:studentId/cgpa-trend', getCGPATrend);
router.get('/student/:studentId/subjects', getSubjectWiseGrades);

// Rankings and statistics
router.get('/rankings/department/:department', getDepartmentRankings);
router.get('/top-performers', getTopPerformers);
router.get('/statistics', getGradeStatistics);

module.exports = router;
