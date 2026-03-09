const mongoose = require('mongoose');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Subject = require('../models/Subject');
const Performance = require('../models/Performance');
const bcrypt = require('bcryptjs');
const { generateId } = require('../utils/generateId');

const toNumber = (value) => Number(value || 0);

const round = (value, decimals = 2) => Number((Number(value) || 0).toFixed(decimals));

const pearsonCorrelation = (pairs) => {
  if (!Array.isArray(pairs) || pairs.length < 2) return 0;
  const xs = pairs.map((pair) => Number(pair.x || 0));
  const ys = pairs.map((pair) => Number(pair.y || 0));
  const xMean = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const yMean = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let i = 0; i < xs.length; i += 1) {
    const xDiff = xs[i] - xMean;
    const yDiff = ys[i] - yMean;
    numerator += xDiff * yDiff;
    xVariance += xDiff * xDiff;
    yVariance += yDiff * yDiff;
  }

  if (!xVariance || !yVariance) return 0;
  return numerator / Math.sqrt(xVariance * yVariance);
};

const buildScopeMetrics = (records) => {
  const totalRecords = records.length;
  const failCount = records.filter((record) => toNumber(record.marks) < 40).length;
  const failRate = totalRecords ? (failCount / totalRecords) * 100 : 0;
  const avgAttendance = totalRecords ? records.reduce((sum, record) => sum + toNumber(record.attendancePercentage), 0) / totalRecords : 0;
  const correlation = pearsonCorrelation(records.map((record) => ({ x: record.attendancePercentage, y: record.marks })));

  const byStudent = new Map();
  for (const record of records) {
    const key = String(record.studentId?._id || record.studentId);
    const existing = byStudent.get(key) || [];
    existing.push(record);
    byStudent.set(key, existing);
  }

  let improvementSum = 0;
  let improvementCount = 0;
  let atRiskStudents = 0;
  for (const items of byStudent.values()) {
    const ordered = [...items].sort((a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime());
    if (ordered.length >= 2) {
      improvementSum += toNumber(ordered[ordered.length - 1].marks) - toNumber(ordered[0].marks);
      improvementCount += 1;
    }
    const latest = ordered[ordered.length - 1];
    if (toNumber(latest.marks) < 60 || toNumber(latest.attendancePercentage) < 75) {
      atRiskStudents += 1;
    }
  }

  return {
    totalRecords,
    failRate: round(failRate, 1),
    averageImprovement: round(improvementCount ? improvementSum / improvementCount : 0, 1),
    attendanceCorrelation: round(correlation, 3),
    poorAttendanceCorrelationScore: round(Math.max(0, correlation) * (1 + Math.max(0, 75 - avgAttendance) / 50), 3),
    atRiskStudents,
    averageAttendance: round(avgAttendance, 1),
  };
};

const getFacultyInsights = async (req, res) => {
  try {
    const { department } = req.query;
    const facultyQuery = { role: 'faculty' };
    if (department) facultyQuery.department = department;

    const [facultyList, subjects] = await Promise.all([
      User.find(facultyQuery)
        .select('_id userId name email department designation status')
        .sort({ createdAt: -1 })
        .lean(),
      Subject.find({})
        .select('_id facultyId subjectName subjectCode department year semester')
        .lean(),
    ]);

    const subjectIds = subjects.map((subject) => subject._id);
    const subjectNames = subjects.map((subject) => subject.subjectName).filter(Boolean);
    const performanceRecords = await Performance.find({
      $or: [
        { subjectId: { $in: subjectIds } },
        { subjectName: { $in: subjectNames } },
      ],
    })
      .select('studentId subjectId subjectName attendancePercentage marks lastUpdated semester')
      .populate('studentId', 'name studentId department year status')
      .lean();

    const subjectById = new Map(subjects.map((subject) => [String(subject._id), subject]));
    const subjectByName = new Map(subjects.map((subject) => [String(subject.subjectName || '').toLowerCase(), subject]));
    const subjectInsightsMap = new Map();

    for (const record of performanceRecords) {
      const subject = subjectById.get(String(record.subjectId || '')) || subjectByName.get(String(record.subjectName || '').toLowerCase());
      if (!subject) continue;
      const key = String(subject._id);
      const existing = subjectInsightsMap.get(key) || { subject, records: [] };
      existing.records.push(record);
      subjectInsightsMap.set(key, existing);
    }

    const subjectInsights = Array.from(subjectInsightsMap.values()).map(({ subject, records }) => ({
      subjectId: String(subject._id),
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      facultyId: subject.facultyId ? String(subject.facultyId) : null,
      department: subject.department,
      year: subject.year,
      semester: subject.semester,
      ...buildScopeMetrics(records),
    }));

    const facultyInsights = facultyList.map((faculty) => {
      const assignedSubjects = subjectInsights.filter((subject) => String(subject.facultyId || '') === String(faculty._id));
      const scopedRecords = assignedSubjects.length > 0
        ? performanceRecords.filter((record) => assignedSubjects.some((subject) => subject.subjectId === String(record.subjectId || '')))
        : performanceRecords.filter((record) => record.studentId?.department === faculty.department);

      return {
        facultyId: String(faculty._id),
        userId: faculty.userId,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        designation: faculty.designation,
        status: faculty.status,
        scopeType: assignedSubjects.length > 0 ? 'assigned_subjects' : 'department_fallback',
        assignedSubjects: assignedSubjects.length,
        ...buildScopeMetrics(scopedRecords),
      };
    });

    const sortDesc = (key) => (a, b) => Number(b[key] || 0) - Number(a[key] || 0);

    res.json({
      success: true,
      data: {
        facultyInsights,
        subjectInsights,
        leaders: {
          highestFailRateFaculty: [...facultyInsights].sort(sortDesc('failRate'))[0] || null,
          bestStudentImprovementFaculty: [...facultyInsights].sort(sortDesc('averageImprovement'))[0] || null,
          poorAttendanceCorrelationFaculty: [...facultyInsights].sort(sortDesc('poorAttendanceCorrelationScore'))[0] || null,
          mostAtRiskStudentsFaculty: [...facultyInsights].sort(sortDesc('atRiskStudents'))[0] || null,
          highestFailRateSubject: [...subjectInsights].sort(sortDesc('failRate'))[0] || null,
          bestStudentImprovementSubject: [...subjectInsights].sort(sortDesc('averageImprovement'))[0] || null,
          poorAttendanceCorrelationSubject: [...subjectInsights].sort(sortDesc('poorAttendanceCorrelationScore'))[0] || null,
          mostAtRiskStudentsSubject: [...subjectInsights].sort(sortDesc('atRiskStudents'))[0] || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFaculty = async (req, res) => {
  try {
    const { department, search } = req.query;
    const query = { role: 'faculty' };

    if (department) query.department = department;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }, { userId: regex }, { designation: regex }];
    }

    const faculty = await User.find(query)
      .select('-password -googleId')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { faculty } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { name, email, password, registerNumber, status, department, designation, bio, expertise, profilePhoto } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    if (registerNumber) {
      const existingRegisterNumber = await User.findOne({ registerNumber: String(registerNumber).trim() });
      if (existingRegisterNumber) {
        return res.status(400).json({ success: false, error: 'Register number already exists' });
      }
    }

    const userId = await generateId('userId');
    const newFaculty = await User.create({
      userId,
      name,
      email: email.toLowerCase(),
      registerNumber: registerNumber ? String(registerNumber).trim() : undefined,
      password,
      role: 'faculty',
      status: status === 'blocked' ? 'blocked' : 'active',
      department,
      designation: designation || 'Faculty Member',
      bio,
      expertise: Array.isArray(expertise) ? expertise : [],
      profilePhoto,
      avatar: profilePhoto,
      authProvider: 'local'
    });

    res.status(201).json({
      success: true,
      message: 'Faculty created successfully',
      data: {
        faculty: {
          _id: newFaculty._id,
          userId: newFaculty.userId,
          name: newFaculty.name,
          email: newFaculty.email,
          role: newFaculty.role
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    delete payload.role;
    delete payload.googleId;

    if (payload.registerNumber !== undefined) {
      payload.registerNumber = String(payload.registerNumber || '').trim() || undefined;
      if (payload.registerNumber) {
        const duplicate = await User.findOne({
          _id: { $ne: id },
          registerNumber: payload.registerNumber,
        });
        if (duplicate) {
          return res.status(400).json({ success: false, error: 'Register number already exists' });
        }
      }
    }

    if (payload.status && !['active', 'blocked'].includes(payload.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (payload.password !== undefined) {
      const passwordText = String(payload.password || '').trim();
      if (!passwordText) {
        delete payload.password;
      } else {
        if (passwordText.length < 8) {
          return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
        }
        payload.password = await bcrypt.hash(passwordText, 10);
      }
    }

    if (payload.profilePhoto) {
      payload.avatar = payload.profilePhoto;
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, role: 'faculty' },
      payload,
      { new: true, runValidators: true }
    ).select('-password -googleId');

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Faculty member not found' });
    }

    res.json({ success: true, message: 'Faculty updated successfully', data: { faculty: updated } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;
    let deletedSummary = null;

    await session.withTransaction(async () => {
      const faculty = await User.findOne({ _id: id, role: 'faculty' }).session(session);
      if (!faculty) {
        const err = new Error('Faculty member not found');
        err.statusCode = 404;
        throw err;
      }

      const [activityDelete, subjectUnassign, facultyDelete] = await Promise.all([
        ActivityLog.deleteMany({ userId: faculty._id }).session(session),
        Subject.updateMany(
          { facultyId: faculty._id },
          { $unset: { facultyId: 1 } }
        ).session(session),
        User.deleteOne({ _id: faculty._id, role: 'faculty' }).session(session),
      ]);

      deletedSummary = {
        faculty: facultyDelete.deletedCount || 0,
        activityLogs: activityDelete.deletedCount || 0,
        subjectsUnassigned: subjectUnassign.modifiedCount || 0,
      };
    });

    res.json({
      success: true,
      message: 'Faculty deleted successfully (cascade)',
      data: { deleted: deletedSummary },
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { getFaculty, getFacultyInsights, createFaculty, updateFaculty, deleteFaculty };
