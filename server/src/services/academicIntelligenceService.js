const Performance = require('../models/Performance');
const Student = require('../models/Student');

const round = (value, decimals = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Number(numeric.toFixed(decimals));
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getTrendLabel = (value, inverse = false) => {
  const normalized = inverse ? -value : value;
  if (normalized >= 3) return 'improving';
  if (normalized <= -5) return 'critical';
  if (normalized <= -2) return 'declining';
  return 'stable';
};

const average = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
};

const buildInterventionSuggestions = ({
  riskTrendScore,
  attendanceDropVelocity,
  marksDeclineLast3,
  backlogProbability,
  departmentComparisonPercentile,
}) => {
  const suggestions = [];

  if (riskTrendScore >= 75) {
    suggestions.push({
      category: 'counseling',
      priority: 'high',
      suggestion: 'Immediate faculty advisor review recommended due to high combined academic risk.',
      expectedImpact: 'Can stabilize performance before the next evaluation cycle.',
    });
  }

  if (attendanceDropVelocity <= -3) {
    suggestions.push({
      category: 'attendance',
      priority: 'high',
      suggestion: 'Attendance is falling rapidly. Trigger attendance follow-up and parent or guardian notification.',
      expectedImpact: 'Reduces absenteeism risk and improves continuity in lectures.',
    });
  }

  if (marksDeclineLast3 >= 10) {
    suggestions.push({
      category: 'subject-focus',
      priority: 'high',
      suggestion: 'Marks have declined across the last three records. Schedule remedial support for weak subjects.',
      expectedImpact: 'Limits further decline and reduces failure probability.',
    });
  }

  if (backlogProbability >= 60) {
    suggestions.push({
      category: 'study-habits',
      priority: 'high',
      suggestion: 'Backlog probability is elevated. Assign structured revision tasks and weekly check-ins.',
      expectedImpact: 'Improves pass probability in high-risk subjects.',
    });
  }

  if (departmentComparisonPercentile <= 30) {
    suggestions.push({
      category: 'time-management',
      priority: 'medium',
      suggestion: 'Student is performing below most department peers. Recommend a workload and study-planning review.',
      expectedImpact: 'Improves comparative standing over the next semester.',
    });
  }

  return suggestions;
};

const computeDepartmentPercentile = async (student, studentAverageMarks) => {
  if (!student?.department) return 0;

  const peerAverages = await Performance.aggregate([
    {
      $lookup: {
        from: 'students',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $match: {
        'student.department': student.department,
        ...(student.year ? { 'student.year': student.year } : {}),
        'student.status': { $ne: 'suspended' },
      },
    },
    {
      $group: {
        _id: '$studentId',
        averageMarks: { $avg: '$marks' },
      },
    },
    { $sort: { averageMarks: 1 } },
  ]);

  if (!peerAverages.length) return 0;

  const lowerOrEqual = peerAverages.filter((row) => Number(row.averageMarks || 0) <= studentAverageMarks).length;
  return round((lowerOrEqual / peerAverages.length) * 100, 1);
};

const computeAcademicIntelligence = async (studentId) => {
  const student = await Student.findById(studentId).select('_id name department year backlogs').lean();
  if (!student) {
    return null;
  }

  const performances = await Performance.find({ studentId })
    .sort({ lastUpdated: 1 })
    .select('marks attendancePercentage subjectName grade lastUpdated')
    .lean();

  if (!performances.length) {
    return {
      riskTrendScore: 0,
      attendanceDropVelocity: 0,
      marksDeclineLast3: 0,
      backlogProbability: student.backlogs > 0 ? 35 : 0,
      departmentComparisonPercentile: 0,
      attendanceMomentum: 'stable',
      performanceMomentum: 'stable',
      recommendations: [],
    };
  }

  const recentAttendance = performances.slice(-4).map((item) => Number(item.attendancePercentage || 0));
  const recentMarks = performances.slice(-4).map((item) => Number(item.marks || 0));
  const lastThreeMarks = performances.slice(-3).map((item) => Number(item.marks || 0));
  const averageAttendance = average(recentAttendance);
  const averageMarks = average(recentMarks);
  const attendanceDropVelocity = recentAttendance.length >= 2
    ? round((recentAttendance[recentAttendance.length - 1] - recentAttendance[0]) / (recentAttendance.length - 1), 2)
    : 0;
  const marksDeclineLast3 = lastThreeMarks.length >= 2
    ? round(Math.max(0, lastThreeMarks[0] - lastThreeMarks[lastThreeMarks.length - 1]), 2)
    : 0;
  const recentFailures = performances.slice(-5).filter((item) => Number(item.marks || 0) < 40).length;
  const backlogProbability = clamp(round(
    (recentFailures * 18)
    + (student.backlogs || 0) * 12
    + Math.max(0, 75 - averageAttendance) * 0.8
    + Math.max(0, 60 - averageMarks) * 1.2
    + Math.max(0, marksDeclineLast3) * 1.1
    + Math.max(0, -attendanceDropVelocity) * 4,
    1
  ), 0, 100);
  const departmentComparisonPercentile = await computeDepartmentPercentile(student, average(performances.map((item) => item.marks)));

  const riskTrendScore = clamp(round(
    Math.max(0, 70 - averageAttendance) * 0.45
    + Math.max(0, 65 - averageMarks) * 0.55
    + Math.max(0, -attendanceDropVelocity) * 6
    + Math.max(0, marksDeclineLast3) * 1.4
    + backlogProbability * 0.35
    + Math.max(0, 50 - departmentComparisonPercentile) * 0.25,
    1
  ), 0, 100);

  const recommendations = buildInterventionSuggestions({
    riskTrendScore,
    attendanceDropVelocity,
    marksDeclineLast3,
    backlogProbability,
    departmentComparisonPercentile,
  });

  return {
    riskTrendScore,
    attendanceDropVelocity,
    marksDeclineLast3,
    backlogProbability,
    departmentComparisonPercentile,
    attendanceMomentum: getTrendLabel(attendanceDropVelocity),
    performanceMomentum: getTrendLabel(marksDeclineLast3, true),
    recommendations,
  };
};

module.exports = {
  computeAcademicIntelligence,
};
