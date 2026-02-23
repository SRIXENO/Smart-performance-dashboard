const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  assignSubjects,
  getSubjectGroups,
  getSubjectGroupByDeptYear,
  getStudentSubjects,
  updateSubjectGroup,
  deleteSubjectGroup
} = require('../controllers/subjectController');

router.post('/assign', authMiddleware, roleMiddleware(['admin']), assignSubjects);
router.get('/', authMiddleware, getSubjectGroups);
router.get('/department/:department/year/:year', authMiddleware, getSubjectGroupByDeptYear);
router.get('/student/:studentId', authMiddleware, getStudentSubjects);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), updateSubjectGroup);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteSubjectGroup);

module.exports = router;
