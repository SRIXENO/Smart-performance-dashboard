const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Get student timeline
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50 } = req.query;
    
    const timeline = await ActivityLog.getStudentTimeline(studentId, parseInt(limit));
    
    res.json({ success: true, data: timeline });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent activities
router.get('/recent', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const activities = await ActivityLog.getRecentActivities(parseInt(limit));
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activities by action type
router.get('/by-action/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const { limit = 50 } = req.query;
    
    const activities = await ActivityLog.find({ action })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin-only login history
router.get('/login-history', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { limit = 200 } = req.query;
    const parsedLimit = parseInt(limit, 10);

    const loginEvents = await ActivityLog.find({ action: 'login' })
      .sort({ timestamp: -1 })
      .limit(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 200)
      .lean();

    const history = loginEvents.map((log) => ({
      id: String(log._id),
      userName: log.userName || 'Unknown',
      email: log.metadata?.email || 'N/A',
      date: log.timestamp || log.createdAt,
      loginMethod: log.metadata?.loginMethod || 'local',
      role: log.userRole || 'unknown',
      userId: log.userId ? String(log.userId) : null,
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
