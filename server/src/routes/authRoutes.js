const express = require('express');
const {
  register,
  login,
  logout,
  me,
  getPendingApprovals,
  updateApprovalStatus,
  getViewers,
  updateViewerStatus,
  deleteViewer,
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { authLimiter, loginLimiter } = require('../middleware/securityMiddleware');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.get('/me', authMiddleware, me);
router.get('/approvals/pending', authMiddleware, roleMiddleware(['admin']), getPendingApprovals);
router.put('/approvals/:id', authMiddleware, roleMiddleware(['admin']), updateApprovalStatus);
router.get('/viewers', authMiddleware, roleMiddleware(['admin']), getViewers);
router.patch('/viewers/:id/status', authMiddleware, roleMiddleware(['admin']), updateViewerStatus);
router.delete('/viewers/:id', authMiddleware, roleMiddleware(['admin']), deleteViewer);

module.exports = router;
