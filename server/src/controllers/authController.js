const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');

const SESSION_MAX_AGE_MS = 3 * 60 * 60 * 1000; // 3 hours

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

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

    const token = generateToken(newUser._id, newUser.role);
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.status(201).json({
      success: true,
      message: 'Registration received. Waiting for admin approval.',
      token,
      user: {
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        approvalStatus: newUser.approvalStatus,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = (email || '').trim();

    if (!identifier || !password) {
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
        isValidPassword = await user.comparePassword(password);
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
      return res.status(403).json({ success: false, error: 'Account is blocked. Contact admin.' });
    }

    const token = generateToken(user._id, user.role);

    await ActivityLog.log({
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
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_MS,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        approvalStatus: user.approvalStatus,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const logout = (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
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
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        approvalStatus: user.approvalStatus,
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

module.exports = { register, login, logout, me, getPendingApprovals, updateApprovalStatus };
