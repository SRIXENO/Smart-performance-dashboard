const AcademicRecord = require('../models/AcademicRecord');
const Student = require('../models/Student');
const Performance = require('../models/Performance');
const ActivityLog = require('../models/ActivityLog');

// Get or create academic record for a student
const getAcademicRecord = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    let record = await AcademicRecord.findOne({ studentId }).populate('studentId', 'name studentId department year');
    
    if (!record) {
      record = new AcademicRecord({ studentId, semesters: [] });
      await record.save();
    }
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add or update semester data
const updateSemesterData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year, subjects, attendancePercentage, status } = req.body;
    
    let record = await AcademicRecord.findOne({ studentId });
    
    if (!record) {
      record = new AcademicRecord({ studentId, semesters: [] });
    }
    
    // Find existing semester or create new
    let semesterIndex = record.semesters.findIndex(
      s => s.semester === semester && s.year === year
    );
    
    // Process subjects and calculate credit points
    const processedSubjects = subjects.map(subject => {
      const gradeInfo = AcademicRecord.calculateGrade(subject.marks);
      const creditPoints = subject.credits * gradeInfo.gradePoint;
      
      return {
        ...subject,
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        creditPoints
      };
    });
    
    const semesterData = {
      semester,
      year,
      subjects: processedSubjects,
      attendancePercentage,
      status: status || 'in-progress'
    };
    
    if (semesterIndex >= 0) {
      record.semesters[semesterIndex] = semesterData;
    } else {
      record.semesters.push(semesterData);
    }
    
    // Calculate SGPA for this semester
    semesterIndex = record.semesters.findIndex(
      s => s.semester === semester && s.year === year
    );
    record.calculateSGPA(semesterIndex);
    
    // Recalculate CGPA
    record.calculateCGPA();
    record.currentSemester = semester;
    record.lastUpdated = new Date();
    
    await record.save();
    
    // Update student's quick stats
    await Student.findByIdAndUpdate(studentId, {
      currentCGPA: record.cgpa,
      totalCreditsEarned: record.totalCreditsEarned,
      currentSemester: semester
    });
    
    // Log activity
    await ActivityLog.log({
      action: 'grade_updated',
      targetType: 'academic_record',
      targetId: studentId,
      description: `Updated semester ${semester} grades`,
      metadata: { semester, year, sgpa: record.semesters[semesterIndex].sgpa }
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Complete a semester
const completeSemester = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.body;
    
    const record = await AcademicRecord.findOne({ studentId });
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Academic record not found' });
    }
    
    const semesterIndex = record.semesters.findIndex(
      s => s.semester === semester && s.year === year
    );
    
    if (semesterIndex < 0) {
      return res.status(404).json({ success: false, error: 'Semester not found' });
    }
    
    record.semesters[semesterIndex].status = 'completed';
    record.semesters[semesterIndex].completedDate = new Date();
    
    // Recalculate CGPA with completed semester
    record.calculateCGPA();
    await record.save();
    
    // Update student
    await Student.findByIdAndUpdate(studentId, {
      currentCGPA: record.cgpa
    });
    
    // Log activity
    await ActivityLog.log({
      action: 'semester_completed',
      targetType: 'academic_record',
      targetId: studentId,
      description: `Completed semester ${semester}`,
      metadata: { semester, year, sgpa: record.semesters[semesterIndex].sgpa, cgpa: record.cgpa }
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get year-wise SGPA
const getYearWiseSGPA = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const record = await AcademicRecord.findOne({ studentId });
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Academic record not found' });
    }
    
    const yearWiseData = record.getYearWiseSGPA();
    
    res.json({ success: true, data: yearWiseData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get CGPA trend
const getCGPATrend = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const record = await AcademicRecord.findOne({ studentId });
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Academic record not found' });
    }
    
    const trend = record.semesters
      .filter(s => s.status === 'completed')
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return parseInt(a.semester) - parseInt(b.semester);
      })
      .map(s => ({
        semester: s.semester,
        year: s.year,
        sgpa: s.sgpa,
        label: `Sem ${s.semester}`
      }));
    
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get subject-wise grades for a student
const getSubjectWiseGrades = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester, year } = req.query;
    
    const record = await AcademicRecord.findOne({ studentId });
    
    if (!record) {
      return res.status(404).json({ success: false, error: 'Academic record not found' });
    }
    
    let subjects = [];
    
    if (semester && year) {
      const sem = record.semesters.find(
        s => s.semester === semester && s.year === parseInt(year)
      );
      subjects = sem ? sem.subjects : [];
    } else {
      // Get all subjects from all semesters
      record.semesters.forEach(sem => {
        subjects.push(...sem.subjects.map(sub => ({
          ...sub.toObject(),
          semester: sem.semester,
          year: sem.year
        })));
      });
    }
    
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get department-wise CGPA rankings
const getDepartmentRankings = async (req, res) => {
  try {
    const { department } = req.params;
    
    const rankings = await AcademicRecord.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student.department': department, 'student.status': 'active' } },
      {
        $project: {
          studentId: '$student._id',
          studentName: '$student.name',
          studentIdNumber: '$student.studentId',
          year: '$student.year',
          cgpa: 1,
          totalCreditsEarned: 1
        }
      },
      { $sort: { cgpa: -1 } }
    ]);
    
    // Add rank
    const rankedData = rankings.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
    
    res.json({ success: true, data: rankedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get top performers
const getTopPerformers = async (req, res) => {
  try {
    const { limit = 10, department, year } = req.query;
    
    const matchStage = {};
    if (department) matchStage['student.department'] = department;
    if (year) matchStage['student.year'] = parseInt(year);
    matchStage['student.status'] = 'active';
    
    const topPerformers = await AcademicRecord.aggregate([
      { $match: { cgpa: { $gt: 0 } } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: matchStage },
      {
        $project: {
          studentId: '$student._id',
          studentName: '$student.name',
          studentIdNumber: '$student.studentId',
          department: '$student.department',
          year: '$student.year',
          cgpa: 1,
          academicStatus: 1
        }
      },
      { $sort: { cgpa: -1 } },
      { $limit: parseInt(limit) }
    ]);
    
    res.json({ success: true, data: topPerformers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Calculate grade statistics
const getGradeStatistics = async (req, res) => {
  try {
    const { department, year, semester } = req.query;
    
    const matchStage = {};
    if (department) matchStage['student.department'] = department;
    if (year) matchStage['student.year'] = parseInt(year);
    
    const stats = await AcademicRecord.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: matchStage },
      {
        $group: {
          _id: null,
          avgCGPA: { $avg: '$cgpa' },
          maxCGPA: { $max: '$cgpa' },
          minCGPA: { $min: '$cgpa' },
          totalStudents: { $sum: 1 },
          excellent: { $sum: { $cond: [{ $gte: ['$cgpa', 9] }, 1, 0] } },
          good: { $sum: { $cond: [{ $and: [{ $gte: ['$cgpa', 7.5] }, { $lt: ['$cgpa', 9] }] }, 1, 0] } },
          average: { $sum: { $cond: [{ $and: [{ $gte: ['$cgpa', 6] }, { $lt: ['$cgpa', 7.5] }] }, 1, 0] } },
          poor: { $sum: { $cond: [{ $and: [{ $gte: ['$cgpa', 5] }, { $lt: ['$cgpa', 6] }] }, 1, 0] } },
          probation: { $sum: { $cond: [{ $lt: ['$cgpa', 5] }, 1, 0] } }
        }
      }
    ]);
    
    res.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getAcademicRecord,
  updateSemesterData,
  completeSemester,
  getYearWiseSGPA,
  getCGPATrend,
  getSubjectWiseGrades,
  getDepartmentRankings,
  getTopPerformers,
  getGradeStatistics
};
