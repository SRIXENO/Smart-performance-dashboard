const Student = require('../models/Student');
const Performance = require('../models/Performance');
const AcademicRecord = require('../models/AcademicRecord');
const AIAnalytics = require('../models/AIAnalytics');
const ActivityLog = require('../models/ActivityLog');

const buildLastSixMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString('en-US', { month: 'short' })
    });
  }
  return months;
};

const roundNumber = (value, decimals = 1) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Number(value.toFixed(decimals));
};

// Enhanced Dashboard data with comprehensive metrics
const getSummary = async (req, res) => {
  try {
    const [totalStudents, activeStudents, perfAgg, lowPerformers, academicStats, aiStats] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'active' }),
      Performance.aggregate([
        {
          $group: {
            _id: null,
            avgAttendance: { $avg: '$attendancePercentage' },
            avgMarks: { $avg: '$marks' }
          }
        }
      ]),
      Performance.countDocuments({
        $or: [
          { attendancePercentage: { $lt: 60 } },
          { marks: { $lt: 50 } }
        ]
      }),
      AcademicRecord.aggregate([
        {
          $group: {
            _id: null,
            avgCGPA: { $avg: '$cgpa' },
            excellentStudents: { $sum: { $cond: [{ $gte: ['$cgpa', 9] }, 1, 0] } },
            goodStudents: { $sum: { $cond: [{ $and: [{ $gte: ['$cgpa', 7.5] }, { $lt: ['$cgpa', 9] }] }, 1, 0] } },
            averageStudents: { $sum: { $cond: [{ $and: [{ $gte: ['$cgpa', 6] }, { $lt: ['$cgpa', 7.5] }] }, 1, 0] } },
            poorStudents: { $sum: { $cond: [{ $lt: ['$cgpa', 6] }, 1, 0] } }
          }
        }
      ]),
      AIAnalytics.aggregate([
        {
          $group: {
            _id: null,
            criticalRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'critical'] }, 1, 0] } },
            highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } },
            improving: { $sum: { $cond: [{ $eq: ['$performanceTrend', 'improving'] }, 1, 0] } },
            declining: { $sum: { $cond: [{ $eq: ['$performanceTrend', 'declining'] }, 1, 0] } }
          }
        }
      ])
    ]);

    const perf = perfAgg[0] || { avgAttendance: 0, avgMarks: 0 };
    const academic = academicStats[0] || { avgCGPA: 0, excellentStudents: 0, goodStudents: 0, averageStudents: 0, poorStudents: 0 };
    const ai = aiStats[0] || { criticalRisk: 0, highRisk: 0, improving: 0, declining: 0 };

    // Calculate pass percentage
    const totalPerformanceRecords = await Performance.countDocuments();
    const passingRecords = await Performance.countDocuments({ marks: { $gte: 40 } });
    const passPercentage = totalPerformanceRecords > 0 ? (passingRecords / totalPerformanceRecords) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        totalStudentsChange: 0,
        avgAttendance: roundNumber(perf.avgAttendance, 1),
        avgAttendanceChange: 0,
        avgPerformance: roundNumber(perf.avgMarks, 1),
        avgPerformanceChange: 0,
        avgCGPA: roundNumber(academic.avgCGPA, 2),
        lowPerformers,
        lowPerformersThreshold: 'attendance < 60% OR marks < 50%',
        passPercentage: roundNumber(passPercentage, 1),
        failPercentage: roundNumber(100 - passPercentage, 1),
        excellentStudents: academic.excellentStudents,
        goodStudents: academic.goodStudents,
        averageStudents: academic.averageStudents,
        poorStudents: academic.poorStudents,
        criticalRiskStudents: ai.criticalRisk,
        highRiskStudents: ai.highRisk,
        improvingStudents: ai.improving,
        decliningStudents: ai.declining
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAttendanceTrend = async (req, res) => {
  try {
    const months = buildLastSixMonths();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 5);
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);

    const agg = await Performance.aggregate([
      { $match: { lastUpdated: { $gte: fromDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$lastUpdated' },
            month: { $month: '$lastUpdated' }
          },
          avgAttendance: { $avg: '$attendancePercentage' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const attendanceMap = new Map();
    for (const item of agg) {
      attendanceMap.set(`${item._id.year}-${item._id.month}`, roundNumber(item.avgAttendance, 1));
    }

    res.json({
      success: true,
      data: {
        months: months.map((m) => m.label),
        attendancePercentages: months.map((m) => attendanceMap.get(m.key) || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getGradeDistribution = async (req, res) => {
  try {
    const agg = await Performance.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } }
    ]);

    const distribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const item of agg) {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    }

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSubjectPerformance = async (req, res) => {
  try {
    const agg = await Performance.aggregate([
      {
        $group: {
          _id: '$subjectId',
          avgMarks: { $avg: '$marks' }
        }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: '_id',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' },
      {
        $project: {
          _id: 0,
          subjectName: '$subject.subjectName',
          avgMarks: { $round: ['$avgMarks', 1] }
        }
      },
      { $sort: { avgMarks: -1 } }
    ]);

    res.json({
      success: true,
      data: agg
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getAtRiskStudents = async (req, res) => {
  try {
    const agg = await Performance.aggregate([
      {
        $match: {
          $or: [
            { attendancePercentage: { $lt: 60 } },
            { marks: { $lt: 50 } }
          ]
        }
      },
      { $sort: { lastUpdated: -1 } },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          _id: 0,
          studentId: '$student.studentId',
          name: '$student.name',
          department: '$student.department',
          year: '$student.year',
          semester: '$semester',
          issue: {
            $cond: [
              { $lt: ['$attendancePercentage', 60] },
              'attendance',
              'marks'
            ]
          },
          value: {
            $cond: [
              { $lt: ['$attendancePercentage', 60] },
              '$attendancePercentage',
              '$marks'
            ]
          },
          alertMessage: {
            $cond: [
              { $lt: ['$attendancePercentage', 60] },
              {
                $concat: [
                  { $toString: { $round: ['$attendancePercentage', 0] } },
                  '% Attendance'
                ]
              },
              {
                $concat: [
                  { $toString: { $round: ['$marks', 0] } },
                  '% Avg Score'
                ]
              }
            ]
          }
        }
      },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: agg
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get department-wise performance comparison
const getDepartmentComparison = async (req, res) => {
  try {
    const comparison = await AcademicRecord.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student.status': 'active' } },
      {
        $group: {
          _id: '$student.department',
          avgCGPA: { $avg: '$cgpa' },
          studentCount: { $sum: 1 },
          maxCGPA: { $max: '$cgpa' },
          minCGPA: { $min: '$cgpa' }
        }
      },
      { $sort: { avgCGPA: -1 } }
    ]);

    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get semester-wise performance distribution
const getSemesterDistribution = async (req, res) => {
  try {
    const distribution = await AcademicRecord.aggregate([
      { $unwind: '$semesters' },
      { $match: { 'semesters.status': 'completed' } },
      {
        $group: {
          _id: { semester: '$semesters.semester', year: '$semesters.year' },
          avgSGPA: { $avg: '$semesters.sgpa' },
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.semester': 1 } }
    ]);

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get attendance heatmap data
const getAttendanceHeatmap = async (req, res) => {
  try {
    const heatmapData = await Performance.aggregate([
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $group: {
          _id: {
            department: '$student.department',
            year: '$student.year'
          },
          avgAttendance: { $avg: '$attendancePercentage' },
          studentCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.department': 1, '_id.year': 1 } }
    ]);

    res.json({ success: true, data: heatmapData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get CGPA distribution histogram
const getCGPADistribution = async (req, res) => {
  try {
    const distribution = await AcademicRecord.aggregate([
      { $match: { cgpa: { $gt: 0 } } },
      {
        $bucket: {
          groupBy: '$cgpa',
          boundaries: [0, 4, 5, 6, 7, 7.5, 8, 8.5, 9, 9.5, 10],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            students: { $push: '$studentId' }
          }
        }
      }
    ]);

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get performance growth rate
const getPerformanceGrowth = async (req, res) => {
  try {
    const growthData = await AcademicRecord.aggregate([
      { $unwind: '$semesters' },
      { $match: { 'semesters.status': 'completed' } },
      { $sort: { 'semesters.year': 1, 'semesters.semester': 1 } },
      {
        $group: {
          _id: { semester: '$semesters.semester', year: '$semesters.year' },
          avgSGPA: { $avg: '$semesters.sgpa' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.semester': 1 } }
    ]);

    // Calculate growth rate
    const growthRates = [];
    for (let i = 1; i < growthData.length; i++) {
      const current = growthData[i].avgSGPA;
      const previous = growthData[i - 1].avgSGPA;
      const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      growthRates.push({
        semester: `Sem ${growthData[i]._id.semester}`,
        year: growthData[i]._id.year,
        sgpa: roundNumber(current, 2),
        growthRate: roundNumber(growthRate, 2)
      });
    }

    res.json({ success: true, data: growthRates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get most difficult subjects
const getDifficultSubjects = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const difficultSubjects = await Performance.aggregate([
      {
        $group: {
          _id: '$subjectName',
          avgMarks: { $avg: '$marks' },
          failureRate: {
            $avg: { $cond: [{ $lt: ['$marks', 40] }, 1, 0] }
          },
          studentCount: { $sum: 1 }
        }
      },
      { $match: { studentCount: { $gte: 5 } } },
      { $sort: { avgMarks: 1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          subjectName: '$_id',
          avgMarks: { $round: ['$avgMarks', 1] },
          failureRate: { $multiply: [{ $round: ['$failureRate', 3] }, 100] },
          studentCount: 1
        }
      }
    ]);

    res.json({ success: true, data: difficultSubjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get attendance vs performance correlation
const getAttendancePerformanceCorrelation = async (req, res) => {
  try {
    const correlationData = await Performance.aggregate([
      {
        $bucket: {
          groupBy: '$attendancePercentage',
          boundaries: [0, 50, 60, 70, 75, 80, 85, 90, 95, 100],
          default: 'Other',
          output: {
            avgMarks: { $avg: '$marks' },
            count: { $sum: 1 }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: correlationData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get recently added students
const getRecentStudents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('studentId name department year enrollmentDate status')
      .lean();

    res.json({ success: true, data: recentStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  getSummary, 
  getAttendanceTrend, 
  getGradeDistribution, 
  getSubjectPerformance, 
  getAtRiskStudents,
  getDepartmentComparison,
  getSemesterDistribution,
  getAttendanceHeatmap,
  getCGPADistribution,
  getPerformanceGrowth,
  getDifficultSubjects,
  getAttendancePerformanceCorrelation,
  getRecentStudents
};
