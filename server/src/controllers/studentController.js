const Student = require('../models/Student');
const Performance = require('../models/Performance');
const User = require('../models/User');
const { generateId } = require('../utils/generateId');

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

const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, year, status } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { studentId: regex }
      ];
    }

    if (department) {
      query.department = department;
    }

    if (year) {
      query.year = parseInt(year, 10);
    }

    if (status) {
      query.status = status;
    }

    const totalStudents = await Student.countDocuments(query);
    const totalPages = Math.ceil(totalStudents / limitNum);

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalStudents,
          limit: limitNum
        }
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

    const newStudent = await Student.create({
      studentId,
      ...studentPayload,
      email: normalizedEmail,
      department: detectedDepartment || studentPayload.department,
    });

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

    const { password: _password, ...studentPayload } = req.body;
    const detectedDepartment = detectDepartmentFromRegisterNumber(studentPayload.rollNumber);
    const updatePayload = {
      ...studentPayload,
      ...(detectedDepartment ? { department: detectedDepartment } : {}),
    };

    console.log('Update request body:', JSON.stringify(req.body, null, 2));
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

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
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const email = String(student.email || '').toLowerCase();
    const registerNumber = String(student.rollNumber || student.studentId || '');

    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    await User.deleteMany({
      role: 'student',
      $or: [{ email }, { registerNumber }],
    });

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
