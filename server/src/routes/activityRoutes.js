const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
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
    const { limit } = req.query;
    const parsedLimit = limit ? parseInt(limit, 10) : null;

    let usersQuery = User.find({})
      .select('name email createdAt')
      .sort({ createdAt: -1 });

    if (parsedLimit && parsedLimit > 0) {
      usersQuery = usersQuery.limit(parsedLimit);
    }

    const users = await usersQuery.lean();

    const emails = users.map((user) => user.email).filter(Boolean);
    const recentLogins = await ActivityLog.aggregate([
      {
        $match: {
          action: 'login',
          'metadata.email': { $in: emails }
        }
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$metadata.email',
          date: { $first: '$timestamp' },
          loginMethod: { $first: '$metadata.loginMethod' },
          userName: { $first: '$userName' }
        }
      }
    ]);

    const loginByEmail = new Map(recentLogins.map((row) => [row._id, row]));
    const history = users.map((user) => {
      const loginInfo = loginByEmail.get(user.email);
      return {
        id: user._id,
        userName: loginInfo?.userName || user.name || 'Unknown',
        email: user.email || 'N/A',
        date: loginInfo?.date || user.createdAt,
        loginMethod: loginInfo?.loginMethod || 'registered'
      };
    });

    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
