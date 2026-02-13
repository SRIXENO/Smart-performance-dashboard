const Student = require('../models/Student');
const Performance = require('../models/Performance');
const { generateId } = require('../utils/generateId');

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
    const studentId = await generateId('studentId');
    const newStudent = await Student.create({
      studentId,
      ...req.body
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
    console.log('Update request body:', JSON.stringify(req.body, null, 2));
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ success: false, error: 'Student not found' });
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
    const deleted = await Student.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };
