const express = require('express');
const router = express.Router();
const {
  assignSubjects,
  getSubjectGroups,
  getSubjectGroupByDeptYear,
  getStudentSubjects,
  updateSubjectGroup,
  deleteSubjectGroup
} = require('../controllers/subjectController');

router.post('/assign', assignSubjects);
router.get('/', getSubjectGroups);
router.get('/department/:department/year/:year', getSubjectGroupByDeptYear);
router.get('/student/:studentId', getStudentSubjects);
router.put('/:id', updateSubjectGroup);
router.delete('/:id', deleteSubjectGroup);

module.exports = router;
