const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const permissionMiddleware = require('../middleware/permissionMiddleware');
const { getFaculty, createFaculty, updateFaculty, deleteFaculty } = require('../controllers/facultyController');

const router = express.Router();

router.get('/', authMiddleware, getFaculty);
router.post('/', authMiddleware, permissionMiddleware('faculty.manage'), createFaculty);
router.put('/:id', authMiddleware, permissionMiddleware('faculty.manage'), updateFaculty);
router.delete('/:id', authMiddleware, permissionMiddleware('faculty.manage'), deleteFaculty);

module.exports = router;
