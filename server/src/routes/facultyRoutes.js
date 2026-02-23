const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');

const router = express.Router();

router.get('/', authMiddleware, getFaculty);
router.post('/', authMiddleware, roleMiddleware(['admin']), createFaculty);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), updateFaculty);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), deleteFaculty);

module.exports = router;
