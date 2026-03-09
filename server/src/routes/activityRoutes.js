const express = require('express');
const { param, query } = require('express-validator');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');

// Get student timeline
router.get('/student/:studentId', [
  param('studentId').isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1, max: 500 }),
], validateRequest, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    
    const [timeline, total] = await Promise.all([
      ActivityLog.find({ targetId: studentId })
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments({ targetId: studentId }),
    ]);
    
    res.json({ success: true, data: { items: timeline, pagination: { currentPage: pageNum, totalPages: Math.max(1, Math.ceil(total / limitNum)), totalRecords: total, limit: limitNum } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent activities
router.get('/recent', [
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1, max: 500 }),
  query('action').optional().isString(),
  query('search').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
], validateRequest, async (req, res) => {
  try {
    const { limit = 100, page = 1, action, search, from, to } = req.query;
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 100));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const queryDoc = {};
    if (action) queryDoc.action = action;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      queryDoc.$or = [{ userName: regex }, { description: regex }, { targetName: regex }];
    }
    if (from || to) {
      queryDoc.timestamp = {};
      if (from) queryDoc.timestamp.$gte = new Date(String(from));
      if (to) queryDoc.timestamp.$lte = new Date(String(to));
    }

    const [activities, total] = await Promise.all([
      ActivityLog.find(queryDoc)
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', 'name email')
        .lean(),
      ActivityLog.countDocuments(queryDoc),
    ]);
    
    res.json({ success: true, data: { items: activities, pagination: { currentPage: pageNum, totalPages: Math.max(1, Math.ceil(total / limitNum)), totalRecords: total, limit: limitNum } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activities by action type
router.get('/by-action/:action', [
  param('action').isString(),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1, max: 500 }),
], validateRequest, async (req, res) => {
  try {
    const { action } = req.params;
    const { limit = 50, page = 1 } = req.query;
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    
    const [activities, total] = await Promise.all([
      ActivityLog.find({ action })
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments({ action }),
    ]);
    
    res.json({ success: true, data: { items: activities, pagination: { currentPage: pageNum, totalPages: Math.max(1, Math.ceil(total / limitNum)), totalRecords: total, limit: limitNum } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin-only login history
router.get('/login-history', authMiddleware, roleMiddleware(['admin']), [
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('page').optional().isInt({ min: 1, max: 500 }),
  query('search').optional().isString(),
  query('role').optional().isString(),
  query('loginMethod').optional().isString(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
], validateRequest, async (req, res) => {
  try {
    const { limit = 50, page = 1, search, role, loginMethod, from, to } = req.query;
    const parsedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const queryDoc = { action: 'login' };
    if (role) queryDoc.userRole = role;
    if (loginMethod) queryDoc['metadata.loginMethod'] = loginMethod;
    if (search) {
      const regex = new RegExp(String(search), 'i');
      queryDoc.$or = [{ userName: regex }, { 'metadata.email': regex }];
    }
    if (from || to) {
      queryDoc.timestamp = {};
      if (from) queryDoc.timestamp.$gte = new Date(String(from));
      if (to) queryDoc.timestamp.$lte = new Date(String(to));
    }

    const [loginEvents, total] = await Promise.all([
      ActivityLog.find(queryDoc)
        .sort({ timestamp: -1 })
        .skip((pageNum - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean(),
      ActivityLog.countDocuments(queryDoc),
    ]);

    const history = loginEvents.map((log) => ({
      id: String(log._id),
      userName: log.userName || 'Unknown',
      email: log.metadata?.email || 'N/A',
      date: log.timestamp || log.createdAt,
      loginMethod: log.metadata?.loginMethod || 'local',
      role: log.userRole || 'unknown',
      userId: log.userId ? String(log.userId) : null,
    }));

    res.json({
      success: true,
      data: {
        items: history,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.max(1, Math.ceil(total / parsedLimit)),
          totalRecords: total,
          limit: parsedLimit,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin-only clear login history by date-time range
router.delete('/login-history', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ success: false, error: 'from and to date-time are required' });
    }

    const fromDate = new Date(String(from));
    const toDate = new Date(String(to));

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid date-time format' });
    }

    if (fromDate > toDate) {
      return res.status(400).json({ success: false, error: 'from must be earlier than or equal to to' });
    }

    const result = await ActivityLog.deleteMany({
      action: 'login',
      timestamp: { $gte: fromDate, $lte: toDate },
    });

    res.json({
      success: true,
      message: 'Login history cleared for selected range',
      data: { deletedCount: result.deletedCount || 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
