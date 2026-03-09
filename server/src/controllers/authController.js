const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');
const { ROLE_PERMISSION_DEFAULTS, resolvePermissions } = require('../utils/permissions');
const { hashToken, getCookieOptions, issueSessionTokens } = require('../utils/authTokens');

const normalizeIdentifier = (value) => String(value || '').trim().slice(0, 254);

const buildAuthPayload = (user) => ({
  userId: user.userId,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  approvalStatus: user.approvalStatus,
  permissions: resolvePermissions(user),
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const { generateId } = require('../utils/generateId');
    const userId = await generateId('userId');
    
    const newUser = await User.create({
      userId,
      name,
      email,
      password,
      role: 'viewer',
      approvalStatus: 'pending',
      authProvider: 'local'
    });

    const { accessToken } = await issueSessionTokens(newUser, req, res);

    res.status(201).json({
      success: true,
      message: 'Registration received. Waiting for admin approval.',
      token: accessToken,
      user: buildAuthPayload(newUser)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.set('Retry-After', '20');
      return res.status(503).json({
        success: false,
        error: 'Authentication service is waking up. Please try again in 10-20 seconds.'
      });
    }

    const { email, password } = req.body;
    const identifier = normalizeIdentifier(email);
    const normalizedPassword = String(password || '').slice(0, 256);

    if (!identifier || !normalizedPassword) {
      return res.status(400).json({ success: false, error: 'Email or register number and password are required' });
    }

    let user = await User.findOne({ email: identifier.toLowerCase() });

    // Allow login by generated userId too
    if (!user) {
      user = await User.findOne({ userId: identifier });
    }

    // Allow login by explicit register number on user account
    if (!user) {
      user = await User.findOne({ registerNumber: identifier });
    }

    // Allow student login by register number or studentId
    if (!user) {
      const student = await Student.findOne({
        $or: [{ rollNumber: identifier }, { studentId: identifier }]
      }).select('email');

      if (student?.email) {
        user = await User.findOne({ email: student.email.toLowerCase() });
      }
    }
    
    let isValidPassword = false;
    if (user) {
      try {
        isValidPassword = await user.comparePassword(normalizedPassword);
      } catch (_err) {
        isValidPassword = false;
      }
    }

    if (!user || !isValidPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({ success: false, error: 'Account approval is pending. Please wait for admin approval.' });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({ success: false, error: 'Your account request was rejected. Contact admin.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'Account is blocked. Contact admin or faculty.' });
    }

    const { accessToken } = await issueSessionTokens(user, req, res);

    void ActivityLog.log({
      userId: user._id,
      userRole: user.role,
      userName: user.name,
      action: 'login',
      targetType: 'system',
      description: 'User logged in with password',
      metadata: {
        email: user.email,
        identifier,
        loginMethod: 'local'
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      user: buildAuthPayload(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        user.refreshTokens = (user.refreshTokens || []).map((session) => {
          if (session.tokenId === decoded.tokenId) {
            session.revokedAt = new Date();
          }
          return session;
        });
        await user.save();
      }
    } catch (_error) {
      // Ignore invalid refresh token on logout.
    }
  }
  res.cookie('token', '', getCookieOptions(0));
  res.cookie('refresh_token', '', getCookieOptions(0));
  res.json({ success: true, message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        ...buildAuthPayload(user),
        avatar: user.avatar,
      }
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPendingApprovals = async (_req, res) => {
  try {
    const users = await User.find({
      role: 'viewer',
      approvalStatus: 'pending',
    })
      .select('userId name email authProvider createdAt status approvalStatus')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateApprovalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;

    if (!['approved', 'rejected'].includes(String(decision))) {
      return res.status(400).json({ success: false, error: 'Invalid decision. Use approved or rejected.' });
    }

    const update = decision === 'approved'
      ? { approvalStatus: 'approved', status: 'active' }
      : { approvalStatus: 'rejected', status: 'blocked' };

    const updated = await User.findOneAndUpdate(
      { _id: id, role: 'viewer' },
      update,
      { new: true }
    ).select('userId name email role status approvalStatus');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Pending viewer account not found' });
    }

    res.json({
      success: true,
      message: `User ${decision} successfully`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getViewers = async (_req, res) => {
  try {
    const viewers = await User.find({ role: 'viewer' })
      .select('userId name email authProvider createdAt status approvalStatus permissions')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: viewers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateViewerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(String(status))) {
      return res.status(400).json({ success: false, error: 'Invalid status. Use active or blocked.' });
    }

    const update = status === 'blocked'
      ? { status: 'blocked' }
      : { status: 'active', approvalStatus: 'approved' };

    const updated = await User.findOneAndUpdate(
      { _id: id, role: 'viewer' },
      update,
      { new: true }
    ).select('userId name email role status approvalStatus');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Viewer account not found' });
    }

    res.json({
      success: true,
      message: `Viewer ${status === 'blocked' ? 'blocked' : 'unblocked'} successfully`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteViewer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.findOneAndDelete({ _id: id, role: 'viewer' }).select('userId name email role');

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Viewer account not found' });
    }

    res.json({
      success: true,
      message: 'Viewer account deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: 'Refresh token missing' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const session = (user.refreshTokens || []).find((item) => item.tokenId === decoded.tokenId);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      user.refreshTokens = [];
      await user.save();
      res.cookie('token', '', getCookieOptions(0));
      res.cookie('refresh_token', '', getCookieOptions(0));
      return res.status(401).json({ success: false, error: 'Refresh session expired' });
    }

    if (session.tokenHash !== hashToken(refreshToken)) {
      user.refreshTokens = [];
      await user.save();
      res.cookie('token', '', getCookieOptions(0));
      res.cookie('refresh_token', '', getCookieOptions(0));
      return res.status(401).json({ success: false, error: 'Refresh token reuse detected' });
    }

    session.lastUsedAt = new Date();
    const { accessToken } = await issueSessionTokens(user, req, res, decoded.tokenId);

    return res.json({
      success: true,
      token: accessToken,
      user: buildAuthPayload(user),
    });
  } catch (error) {
    res.cookie('token', '', getCookieOptions(0));
    res.cookie('refresh_token', '', getCookieOptions(0));
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};

const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const permissions = (req.body && typeof req.body.permissions === 'object' && req.body.permissions) ? req.body.permissions : null;

    if (!permissions) {
      return res.status(400).json({ success: false, error: 'permissions object is required' });
    }

    const allowedKeys = Object.keys(ROLE_PERMISSION_DEFAULTS.admin);
    const sanitizedPermissions = allowedKeys.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(permissions, key)) {
        acc[key] = Boolean(permissions[key]);
      }
      return acc;
    }, {});

    const updated = await User.findByIdAndUpdate(
      id,
      { $set: { permissions: sanitizedPermissions } },
      { new: true, runValidators: true }
    ).select('userId name email role status approvalStatus permissions');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.json({
      success: true,
      message: 'Permissions updated successfully',
      data: {
        user: buildAuthPayload(updated),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  getPendingApprovals,
  updateApprovalStatus,
  getViewers,
  updateViewerStatus,
  deleteViewer,
  updateUserPermissions,
};
