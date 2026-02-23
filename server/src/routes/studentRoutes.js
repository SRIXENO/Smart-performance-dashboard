const express = require('express');
const { getStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../controllers/studentController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getStudents);
router.get('/:id', authMiddleware, getStudentById);
router.post('/', authMiddleware, roleMiddleware(['admin']), createStudent);
router.put('/:id', authMiddleware, roleMiddleware(['admin', 'faculty']), updateStudent);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteStudent);

module.exports = router;
