const mongoose = require('mongoose');
const Student = require('../models/Student');
const Performance = require('../models/Performance');
const AcademicRecord = require('../models/AcademicRecord');
const AIAnalytics = require('../models/AIAnalytics');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');
const { generateId } = require('../utils/generateId');
const { ensureStudentEnrollment, getStudentConnectedProfile, inferSemesterNumber } = require('../services/academicDataService');
const { getCacheIfFresh, upsertStudentCache } = require('../services/analyticsService');

const DEPARTMENT_CODE_MAP = {
  CS: 'Computer Science',
  IT: 'Information Technology',
  EC: 'Electrical and Communication Engineering',
  ECE: 'Electrical and Communication Engineering',
  EE: 'Electrical and Electronic Engineering',
  EEE: 'Electrical and Electronic Engineering',
  ME: 'Mechanical',
  CE: 'Civil',
  BT: 'Biotechnology',
};

const detectDepartmentFromRegisterNumber = (value) => {
  if (!value || typeof value !== 'string') return '';
  const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = upper.match(/[A-Z]{2}/);
  if (!match) return '';
  return DEPARTMENT_CODE_MAP[match[0]] || '';
};

const getYearSemesterDefaults = (year) => {
  const numericYear = Number(year);
  if (!Number.isFinite(numericYear) || numericYear < 1 || numericYear > 4) {
    return { semester: 1, currentSemester: 'Semester 1' };
  }
  const semester = ((numericYear - 1) * 2) + 1;
  return { semester, currentSemester: `Semester ${semester}` };
};

const normalizeSemesterFields = (incoming, existingStudent) => {
  const payload = { ...incoming };
  const fallbackYear = existingStudent?.year;
  const year = Number(payload.year ?? fallbackYear);
  const defaults = getYearSemesterDefaults(year);

  const existingSemester = Number(existingStudent?.semester);
  const existingCurrent = String(existingStudent?.currentSemester || '').trim();

  let numericSemester = Number(payload.semester ?? existingSemester);
  let currentSemester = String(payload.currentSemester ?? existingCurrent).trim();

  if (!Number.isFinite(numericSemester) && currentSemester) {
    const match = currentSemester.match(/(\d+)/);
    if (match) numericSemester = Number(match[1]);
  }

  if (!Number.isFinite(numericSemester) || numericSemester < 1 || numericSemester > 8) numericSemester = defaults.semester;

  if (!currentSemester) {
    currentSemester = `Semester ${numericSemester}`;
  }

  payload.semester = numericSemester;
  payload.currentSemester = currentSemester;
  return payload;
};

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, year, semester, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const allowedSortFields = new Set(['createdAt', 'name', 'studentId', 'department', 'year', 'semester', 'status']);
    const sortField = allowedSortFields.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortOrder = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;

    const query = {};

    const isViewer = req.user?.role === 'viewer';

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = isViewer
        ? [{ name: regex }, { department: regex }]
        : [{ name: regex }, { email: regex }, { studentId: regex }];
    }

    if (department) {
      query.department = department;
    }

    if (year) {
      query.year = parseInt(year, 10);
    }

    if (semester) {
      query.semester = parseInt(semester, 10);
    }

    if (status) {
      query.status = status;
    }

    const totalStudents = await Student.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limitNum);

    const studentsQuery = Student.find(query)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (isViewer) {
      studentsQuery.select('_id name department year semester currentSemester');
    } else {
      // Keep list responses lean; avoid sending heavy profile/document fields.
      studentsQuery.select('_id studentId name email gender year semester currentSemester department cgpa attendance status enrollmentDate');
    }

    const students = await studentsQuery;
    const normalizedStudents = students.map((studentDoc) => {
      const student = typeof studentDoc.toObject === 'function' ? studentDoc.toObject() : studentDoc;
      const defaults = getYearSemesterDefaults(student.year);
      const numericSemester = Number(student.semester);
      const currentSemester = String(student.currentSemester || '').trim();
      return {
        ...student,
        semester: Number.isFinite(numericSemester) && numericSemester >= 1 && numericSemester <= 8 ? numericSemester : defaults.semester,
        currentSemester: currentSemester || `Semester ${Number.isFinite(numericSemester) && numericSemester >= 1 && numericSemester <= 8 ? numericSemester : defaults.semester}`,
      };
    });

    const withDerived = normalizedStudents.map((student) => ({
      ...student,
      currentSemester: student.currentSemester || `Semester ${inferSemesterNumber(student.year, student.semester, student.currentSemester)}`,
    }));

    res.json({
      success: true,
      data: {
        students: withDerived,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          limit: limitNum
        },
        filters: {
          search: search || '',
          department: department || '',
          year: year || '',
          semester: semester || '',
          status: status || '',
          sortBy: sortField,
          sortDir: sortOrder === 1 ? 'asc' : 'desc',
        },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const performanceAgg = await Performance.aggregate([
      { $match: { studentId: student._id } },
      {
        $group: {
          _id: null,
          avgAttendance: { $avg: '$attendancePercentage' },
          avgMarks: { $avg: '$marks' },
          subjectIds: { $addToSet: '$subjectId' }
        }
      },
      {
        $project: {
          _id: 0,
          avgAttendance: 1,
          avgMarks: 1,
          totalSubjects: { $size: '$subjectIds' }
        }
      }
    ]);

    const summary = performanceAgg[0] || {
      avgAttendance: 0,
      avgMarks: 0,
      totalSubjects: 0
    };

    res.json({
      success: true,
      data: {
        student,
        performanceSummary: {
          overallAttendance: Number(summary.avgAttendance?.toFixed(1) || 0),
          overallAvgMarks: Number(summary.avgMarks?.toFixed(1) || 0),
          totalSubjects: summary.totalSubjects || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { password, ...studentPayload } = req.body;
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password (min 8 characters) is required for student login account' });
    }

    const detectedDepartment = detectDepartmentFromRegisterNumber(studentPayload.rollNumber);

    const studentId = await generateId('studentId');
    const normalizedEmail = String(studentPayload.email || '').toLowerCase();
    const registerNumber = String(studentPayload.rollNumber || studentId);

    const existingUserByEmail = await User.findOne({ email: normalizedEmail });
    if (existingUserByEmail) {
      return res.status(400).json({ success: false, error: 'Email already exists in login accounts' });
    }

    const existingUserByRegNo = await User.findOne({ registerNumber });
    if (existingUserByRegNo) {
      return res.status(400).json({ success: false, error: 'Register number already exists in login accounts' });
    }

    const normalizedStudentPayload = normalizeSemesterFields(studentPayload);

    const newStudent = await Student.create({
      studentId,
      ...normalizedStudentPayload,
      email: normalizedEmail,
      department: detectedDepartment || normalizedStudentPayload.department,
    });
    await ensureStudentEnrollment(newStudent);

    const userId = await generateId('userId');
    await User.create({
      userId,
      name: newStudent.name,
      email: normalizedEmail,
      registerNumber,
      password: String(password),
      role: 'student',
      status: ['inactive', 'suspended'].includes(String(newStudent.status || '').toLowerCase()) ? 'blocked' : 'active',
      department: newStudent.department,
      authProvider: 'local',
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { studentId: newStudent.studentId, name: newStudent.name, email: newStudent.email, _id: newStudent._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const { password: newPasswordRaw, ...studentPayload } = req.body;
    const newPassword = String(newPasswordRaw || '').trim();
    if (newPasswordRaw !== undefined && newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const detectedDepartment = detectDepartmentFromRegisterNumber(studentPayload.rollNumber);
    const updatePayload = normalizeSemesterFields({
      ...studentPayload,
      ...(detectedDepartment ? { department: detectedDepartment } : {}),
    }, existingStudent);

    console.log('Update request body:', JSON.stringify(req.body, null, 2));
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );
    await ensureStudentEnrollment(updatedStudent);

    const oldEmail = String(existingStudent.email || '').toLowerCase();
    const newEmail = String(updatedStudent.email || '').toLowerCase();
    const oldRegisterNumber = String(existingStudent.rollNumber || existingStudent.studentId || '');
    const newRegisterNumber = String(updatedStudent.rollNumber || updatedStudent.studentId || '');
    const userStatus = ['inactive', 'suspended'].includes(String(updatedStudent.status || '').toLowerCase()) ? 'blocked' : 'active';

    const linkedUser = await User.findOne({
      role: 'student',
      $or: [
        { email: oldEmail },
        { email: newEmail },
        { registerNumber: oldRegisterNumber },
        { registerNumber: newRegisterNumber },
      ],
    });

    if (linkedUser) {
      linkedUser.name = updatedStudent.name;
      linkedUser.email = newEmail;
      linkedUser.registerNumber = newRegisterNumber;
      linkedUser.department = updatedStudent.department;
      linkedUser.status = userStatus;
      if (newPassword) {
        linkedUser.password = newPassword;
      }
      await linkedUser.save();
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: { studentId: updatedStudent.studentId, name: updatedStudent.name, email: updatedStudent.email }
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteStudent = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    let deletedSummary = null;
    await session.withTransaction(async () => {
      const student = await Student.findById(req.params.id).session(session);
      if (!student) {
        const err = new Error('Student not found');
        err.statusCode = 404;
        throw err;
      }

      const email = String(student.email || '').toLowerCase();
      const registerNumber = String(student.rollNumber || student.studentId || '');

      const linkedUser = await User.findOne({
        role: 'student',
        $or: [{ email }, { registerNumber }],
      }).session(session);

      const userId = linkedUser?._id || null;

      const [performanceDelete, academicDelete, aiDelete, activityDelete, userDelete, studentDelete] = await Promise.all([
        Performance.deleteMany({ studentId: student._id }).session(session),
        AcademicRecord.deleteMany({ studentId: student._id }).session(session),
        AIAnalytics.deleteMany({ studentId: student._id }).session(session),
        ActivityLog.deleteMany({
          $or: [{ targetId: student._id }, ...(userId ? [{ userId }] : [])],
        }).session(session),
        userId ? User.deleteOne({ _id: userId }).session(session) : Promise.resolve({ deletedCount: 0 }),
        Student.deleteOne({ _id: student._id }).session(session),
      ]);

      deletedSummary = {
        student: studentDelete.deletedCount || 0,
        user: userDelete.deletedCount || 0,
        performance: performanceDelete.deletedCount || 0,
        academicRecord: academicDelete.deletedCount || 0,
        aiAnalytics: aiDelete.deletedCount || 0,
        activityLogs: activityDelete.deletedCount || 0,
      };
    });

    res.json({
      success: true,
      message: 'Student deleted successfully (cascade)',
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

const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    const profile = await getStudentConnectedProfile(student);
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStudentSubjects = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    const profile = await getStudentConnectedProfile(student);
    res.json({
      success: true,
      data: {
        student: profile.student,
        semester: profile.semester,
        subjects: profile.eligibleSubjects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStudentAnalytics = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('_id studentId name department year semester currentSemester status').lean();
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const cached = await getCacheIfFresh({ scope: 'student', studentId: student._id, maxAgeSeconds: 90 });
    const metrics = cached || await upsertStudentCache(student._id);

    res.json({
      success: true,
      data: {
        student,
        metrics,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getStudents, getStudentById, getStudentProfile, getStudentSubjects, getStudentAnalytics, createStudent, updateStudent, deleteStudent };
