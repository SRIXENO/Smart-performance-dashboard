const express = require('express');
const { getStudents, getStudentById, getStudentProfile, getStudentSubjects, getStudentAnalytics, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), getStudents);
router.get('/:id/profile', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), getStudentProfile);
router.get('/:id/subjects', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), getStudentSubjects);
router.get('/:id/analytics', authMiddleware, roleMiddleware(['admin', 'faculty', 'viewer']), getStudentAnalytics);
router.get('/:id', authMiddleware, roleMiddleware(['admin', 'faculty']), getStudentById);
router.post('/', authMiddleware, roleMiddleware(['admin']), createStudent);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'faculty']), updateStudent);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteStudent);

module.exports = router;
