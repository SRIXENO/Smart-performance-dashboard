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

const buildStudentOwnershipClauses = (reqUser = null) => {
  if (reqUser?.role !== 'student') return [];

  const clauses = [];
  const email = String(reqUser?.email || '').trim().toLowerCase();
  const registerNumber = String(reqUser?.registerNumber || '').trim();
  const studentId = String(reqUser?.studentId || '').trim();

  if (email) clauses.push({ email });
  if (registerNumber) {
    clauses.push({ rollNumber: registerNumber });
    clauses.push({ studentId: registerNumber });
  }
  if (studentId) clauses.push({ studentId });

  return clauses;
};

const mergeStudentOwnershipIntoQuery = (query = {}, reqUser = null) => {
  const ownershipClauses = buildStudentOwnershipClauses(reqUser);
  if (!ownershipClauses.length) return reqUser?.role === 'student' ? { _id: null } : query;

  const nextQuery = { ...query };
  if (nextQuery.$or) {
    const searchClauses = nextQuery.$or;
    delete nextQuery.$or;
    return {
      ...nextQuery,
      $and: [
        { $or: ownershipClauses },
        { $or: searchClauses },
      ],
    };
  }

  return {
    ...nextQuery,
    $or: ownershipClauses,
  };
};

const buildStudentQuery = (filters = {}, reqUser = null) => {
  const { search, department, year, semester, status } = filters;
  const query = {};
  const isViewer = reqUser?.role === 'viewer' || reqUser?.role === 'student';

  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = isViewer
      ? [{ name: regex }, { department: regex }]
      : [{ name: regex }, { email: regex }, { studentId: regex }];
  }

  if (department) query.department = department;
  if (year) query.year = parseInt(year, 10);
  if (semester) query.semester = parseInt(semester, 10);
  if (status) query.status = status;

  return mergeStudentOwnershipIntoQuery(query, reqUser);
};

const buildBulkStudentMatch = ({ studentIds, department, year, semester, status }) => {
  const query = {};
  if (Array.isArray(studentIds) && studentIds.length) {
    query._id = { $in: studentIds };
  }
  if (department) query.department = department;
  if (year) query.year = parseInt(year, 10);
  if (semester) query.semester = parseInt(semester, 10);
  if (status) query.status = status;
  return query;
};

const toUserStatusFromStudentStatus = (studentStatus) =>
  ['inactive', 'suspended'].includes(String(studentStatus || '').toLowerCase()) ? 'blocked' : 'active';

const csvEscape = (value) => {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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

    const query = buildStudentQuery({ search, department, year, semester, status }, req.user);
    const isViewer = req.user?.role === 'viewer' || req.user?.role === 'student';
    const isStudent = req.user?.role === 'student';

    const totalStudents = await Student.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limitNum);

    const studentsQuery = Student.find(query)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (isViewer) {
      if (isStudent) {
        studentsQuery.select('_id name department year semester currentSemester email rollNumber studentId');
      } else {
        studentsQuery.select('_id name department year semester currentSemester');
      }
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

    const withDerived = normalizedStudents.map((student) => {
      const base = {
        ...student,
        currentSemester: student.currentSemester || `Semester ${inferSemesterNumber(student.year, student.semester, student.currentSemester)}`,
      };
      if (!isStudent) return base;

      const email = String(req.user?.email || '').toLowerCase();
      const registerNumber = String(req.user?.registerNumber || '').trim();
      const studentId = String(req.user?.studentId || '').trim();
      const matchesStudent =
        (email && String(student.email || '').toLowerCase() === email) ||
        (registerNumber && (String(student.rollNumber || '') === registerNumber || String(student.studentId || '') === registerNumber)) ||
        (studentId && String(student.studentId || '') === studentId);

      const { email: _email, rollNumber: _rollNumber, studentId: _studentId, ...safe } = base;
      return { ...safe, isSelf: matchesStudent };
    });

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
    if (req.user?.role === 'student') {
      const student = await Student.findById(req.params.id);
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      const email = String(req.user?.email || '').toLowerCase();
      const registerNumber = String(req.user?.registerNumber || '').trim();
      const matchesStudent =
        (email && String(student.email || '').toLowerCase() === email) ||
        (registerNumber && (String(student.rollNumber || '') === registerNumber || String(student.studentId || '') === registerNumber)) ||
        (req.user?.studentId && String(student.studentId || '') === String(req.user.studentId));
      if (!matchesStudent) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
    }

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

const bulkUpdateStudentStatus = async (req, res) => {
  try {
    const { studentIds, department, year, semester, fromStatus, toStatus } = req.body;
    const query = buildBulkStudentMatch({ studentIds, department, year, semester, status: fromStatus });
    if (!Object.keys(query).length) {
      return res.status(400).json({ success: false, error: 'Provide studentIds or at least one filter for bulk status update' });
    }

    const students = await Student.find(query).select('_id name email rollNumber studentId status department year semester').lean();
    if (!students.length) {
      return res.status(404).json({ success: false, error: 'No students matched for bulk status update' });
    }

    const studentIdsToUpdate = students.map((student) => student._id);
    const targetUserStatus = toUserStatusFromStudentStatus(toStatus);
    const userEmailList = students.map((student) => String(student.email || '').toLowerCase()).filter(Boolean);
    const registerNumbers = students.map((student) => String(student.rollNumber || student.studentId || '')).filter(Boolean);

    const [studentResult, userResult] = await Promise.all([
      Student.updateMany({ _id: { $in: studentIdsToUpdate } }, { $set: { status: toStatus } }),
      User.updateMany(
        {
          role: 'student',
          $or: [
            { email: { $in: userEmailList } },
            { registerNumber: { $in: registerNumbers } },
          ],
        },
        { $set: { status: targetUserStatus } }
      ),
    ]);

    await ActivityLog.log({
      userId: req.user?._id,
      userRole: req.user?.role || 'admin',
      userName: req.user?.name || 'System',
      action: 'bulk_update',
      targetType: 'student',
      description: `Bulk student status change to ${toStatus}`,
      metadata: {
        matchedStudents: students.length,
        fromStatus: fromStatus || 'any',
        toStatus,
        department: department || null,
        year: year || null,
        semester: semester || null,
      },
      status: 'success',
    });

    res.json({
      success: true,
      message: `Updated ${studentResult.modifiedCount || 0} students to ${toStatus}`,
      data: {
        matchedStudents: students.length,
        modifiedStudents: studentResult.modifiedCount || 0,
        modifiedUsers: userResult.modifiedCount || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const bulkPromoteStudents = async (req, res) => {
  try {
    const { studentIds, department, year, semester, status = 'active' } = req.body;
    const query = buildBulkStudentMatch({ studentIds, department, year, semester, status });
    if (!Object.keys(query).length) {
      return res.status(400).json({ success: false, error: 'Provide studentIds or at least one filter for bulk promotion' });
    }

    const students = await Student.find(query).select('_id name email rollNumber studentId status department year semester currentSemester').lean();
    if (!students.length) {
      return res.status(404).json({ success: false, error: 'No students matched for semester promotion' });
    }

    let promoted = 0;
    let graduated = 0;

    for (const student of students) {
      const currentSemester = inferSemesterNumber(student.year, student.semester, student.currentSemester);
      let nextStatus = student.status;
      let nextSemester = currentSemester;
      let nextYear = Number(student.year) || 1;

      if (currentSemester >= 8) {
        nextStatus = 'graduated';
        nextSemester = 8;
        nextYear = 4;
        graduated += 1;
      } else {
        nextSemester = currentSemester + 1;
        nextYear = Math.min(4, Math.ceil(nextSemester / 2));
        promoted += 1;
      }

      const updatedStudent = await Student.findByIdAndUpdate(
        student._id,
        {
          $set: {
            year: nextYear,
            semester: nextSemester,
            currentSemester: `Semester ${nextSemester}`,
            status: nextStatus,
          },
        },
        { new: true }
      );

      if (updatedStudent) {
        await ensureStudentEnrollment(updatedStudent);
        await User.updateMany(
          {
            role: 'student',
            $or: [
              { email: String(updatedStudent.email || '').toLowerCase() },
              { registerNumber: String(updatedStudent.rollNumber || updatedStudent.studentId || '') },
            ],
          },
          {
            $set: {
              department: updatedStudent.department,
              status: toUserStatusFromStudentStatus(updatedStudent.status),
            },
          }
        );
      }
    }

    await ActivityLog.log({
      userId: req.user?._id,
      userRole: req.user?.role || 'admin',
      userName: req.user?.name || 'System',
      action: 'bulk_update',
      targetType: 'student',
      description: 'Bulk semester promotion completed',
      metadata: {
        matchedStudents: students.length,
        promoted,
        graduated,
        department: department || null,
        year: year || null,
        semester: semester || null,
      },
      status: 'success',
    });

    res.json({
      success: true,
      message: `Processed ${students.length} students`,
      data: {
        matchedStudents: students.length,
        promoted,
        graduated,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const exportStudents = async (req, res) => {
  try {
    const { search, department, year, semester, status, sortBy = 'createdAt', sortDir = 'desc' } = req.query;
    const allowedSortFields = new Set(['createdAt', 'name', 'studentId', 'department', 'year', 'semester', 'status']);
    const sortField = allowedSortFields.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const sortOrder = String(sortDir).toLowerCase() === 'asc' ? 1 : -1;
    const query = buildStudentQuery({ search, department, year, semester, status }, req.user);

    const students = await Student.find(query)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .select('_id studentId name email department year semester currentSemester status enrollmentDate')
      .lean();

    const headers = ['studentId', 'name', 'email', 'department', 'year', 'semester', 'currentSemester', 'status', 'enrollmentDate'];
    const rows = students.map((student) => ([
      student.studentId,
      student.name,
      student.email,
      student.department,
      student.year,
      student.semester,
      student.currentSemester,
      student.status,
      student.enrollmentDate ? new Date(student.enrollmentDate).toISOString() : '',
    ].map(csvEscape).join(',')));

    const csv = [headers.join(','), ...rows].join('\n');
    await ActivityLog.log({
      userId: req.user?._id,
      userRole: req.user?.role || 'admin',
      userName: req.user?.name || 'System',
      action: 'report_exported',
      targetType: 'system',
      description: 'Exported filtered student report',
      metadata: {
        totalRows: students.length,
        filters: { search: search || null, department: department || null, year: year || null, semester: semester || null, status: status || null },
      },
      status: 'success',
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="students-report-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    if (req.user?.role === 'student') {
      const email = String(req.user?.email || '').toLowerCase();
      const registerNumber = String(req.user?.registerNumber || '').trim();
      const student = await Student.findById(req.params.id).lean();
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      const matchesStudent =
        (email && String(student.email || '').toLowerCase() === email) ||
        (registerNumber && (String(student.rollNumber || '') === registerNumber || String(student.studentId || '') === registerNumber)) ||
        (req.user?.studentId && String(student.studentId || '') === String(req.user.studentId));
      if (!matchesStudent) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const profile = await getStudentConnectedProfile(student);
      return res.json({ success: true, data: profile });
    }

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
    if (req.user?.role === 'student') {
      const email = String(req.user?.email || '').toLowerCase();
      const registerNumber = String(req.user?.registerNumber || '').trim();
      const student = await Student.findById(req.params.id).lean();
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      const matchesStudent =
        (email && String(student.email || '').toLowerCase() === email) ||
        (registerNumber && (String(student.rollNumber || '') === registerNumber || String(student.studentId || '') === registerNumber)) ||
        (req.user?.studentId && String(student.studentId || '') === String(req.user.studentId));
      if (!matchesStudent) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }
      const profile = await getStudentConnectedProfile(student);
      return res.json({
        success: true,
        data: {
          student: profile.student,
          semester: profile.semester,
          subjects: profile.eligibleSubjects
        }
      });
    }

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
    if (req.user?.role === 'student') {
      const email = String(req.user?.email || '').toLowerCase();
      const registerNumber = String(req.user?.registerNumber || '').trim();
      const student = await Student.findById(req.params.id).select('_id studentId name department year semester currentSemester status email rollNumber').lean();
      if (!student) {
        return res.status(404).json({ success: false, error: 'Student not found' });
      }
      const matchesStudent =
        (email && String(student.email || '').toLowerCase() === email) ||
        (registerNumber && (String(student.rollNumber || '') === registerNumber || String(student.studentId || '') === registerNumber)) ||
        (req.user?.studentId && String(student.studentId || '') === String(req.user.studentId));
      if (!matchesStudent) {
        return res.status(403).json({ success: false, error: 'Forbidden' });
      }

      const cached = await getCacheIfFresh({ scope: 'student', studentId: student._id, maxAgeSeconds: 90 });
      const metrics = cached || await upsertStudentCache(student._id);

      return res.json({
        success: true,
        data: {
          student: {
            _id: student._id,
            studentId: student.studentId,
            name: student.name,
            department: student.department,
            year: student.year,
            semester: student.semester,
            currentSemester: student.currentSemester,
            status: student.status,
          },
          metrics,
        },
      });
    }

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

module.exports = {
  getStudents,
  getStudentById,
  getStudentProfile,
  getStudentSubjects,
  getStudentAnalytics,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkUpdateStudentStatus,
  bulkPromoteStudents,
  exportStudents,
};
