const express = require('express');
const { register, login, logout, me, getPendingApprovals, updateApprovalStatus } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.get('/approvals/pending', authMiddleware, roleMiddleware(['admin']), getPendingApprovals);
router.put('/approvals/:id', authMiddleware, roleMiddleware(['admin']), updateApprovalStatus);

module.exports = router;
