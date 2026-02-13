const AIAnalytics = require('../models/AIAnalytics');
const AcademicRecord = require('../models/AcademicRecord');
const Performance = require('../models/Performance');
const Student = require('../models/Student');
const ActivityLog = require('../models/ActivityLog');

// Get or create AI analytics for a student
const getStudentAnalytics = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    let analytics = await AIAnalytics.findOne({ studentId })
      .populate('studentId', 'name studentId department year');
    
    if (!analytics) {
      analytics = new AIAnalytics({ studentId });
      await analytics.save();
    }
    
    // Check if analysis is stale (older than 24 hours)
    const hoursSinceLastAnalysis = (Date.now() - analytics.lastAnalyzed) / (1000 * 60 * 60);
    
    if (hoursSinceLastAnalysis > 24) {
      // Trigger fresh analysis
      await runStudentAnalysis(studentId);
      analytics = await AIAnalytics.findOne({ studentId })
        .populate('studentId', 'name studentId department year');
    }
    
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Run comprehensive AI analysis for a student
const runStudentAnalysis = async (studentId) => {
  try {
    let analytics = await AIAnalytics.findOne({ studentId });
    
    if (!analytics) {
      analytics = new AIAnalytics({ studentId });
    }
    
    // Calculate risk score
    await analytics.calculateRiskScore();
    
    // Generate alerts
    await analytics.generateAlerts();
    
    // Predict performance
    await analytics.predictPerformance();
    
    // Analyze trends
    await analyzeTrends(analytics);
    
    // Generate suggestions
    await generateSuggestions(analytics);
    
    // Subject-wise analysis
    await analyzeSubjects(analytics);
    
    // Peer comparison
    await comparePeers(analytics);
    
    analytics.lastAnalyzed = new Date();
    await analytics.save();
    
    // Log activity
    await ActivityLog.log({
      action: 'ai_prediction',
      targetType: 'student',
      targetId: studentId,
      description: 'AI analysis completed',
      metadata: { riskScore: analytics.riskScore, riskLevel: analytics.riskLevel }
    });
    
    return analytics;
  } catch (error) {
    console.error('AI Analysis failed:', error);
    throw error;
  }
};

// Analyze attendance and performance trends
const analyzeTrends = async (analytics) => {
  const recentPerformance = await Performance.find({ studentId: analytics.studentId })
    .sort({ lastUpdated: -1 })
    .limit(10);
  
  if (recentPerformance.length < 3) {
    analytics.attendanceTrend = 'stable';
    analytics.performanceTrend = 'stable';
    return;
  }
  
  // Attendance trend
  const attendanceValues = recentPerformance.slice(0, 5).map(p => p.attendancePercentage);
  const attendanceSlope = calculateTrendSlope(attendanceValues);
  
  if (attendanceSlope < -5) analytics.attendanceTrend = 'declining';
  else if (attendanceSlope < -2) analytics.attendanceTrend = 'critical';
  else if (attendanceSlope > 5) analytics.attendanceTrend = 'improving';
  else analytics.attendanceTrend = 'stable';
  
  // Performance trend
  const marksValues = recentPerformance.slice(0, 5).map(p => p.marks);
  const marksSlope = calculateTrendSlope(marksValues);
  
  if (marksSlope < -5) analytics.performanceTrend = 'declining';
  else if (marksSlope < -2) analytics.performanceTrend = 'critical';
  else if (marksSlope > 5) analytics.performanceTrend = 'improving';
  else analytics.performanceTrend = 'stable';
  
  // Store historical data
  const academicRecord = await AcademicRecord.findOne({ studentId: analytics.studentId });
  if (academicRecord) {
    analytics.historicalData = academicRecord.semesters
      .filter(s => s.status === 'completed')
      .map(s => ({
        semester: s.semester,
        sgpa: s.sgpa,
        attendance: s.attendancePercentage,
        timestamp: s.completedDate || new Date()
      }));
  }
};

// Calculate trend slope (simple linear regression)
const calculateTrendSlope = (values) => {
  if (values.length < 2) return 0;
  
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }
  
  return denominator !== 0 ? numerator / denominator : 0;
};

// Generate improvement suggestions
const generateSuggestions = async (analytics) => {
  const suggestions = [];
  const recentPerformance = await Performance.find({ studentId: analytics.studentId })
    .sort({ lastUpdated: -1 })
    .limit(5);
  
  if (recentPerformance.length === 0) return;
  
  const avgAttendance = recentPerformance.reduce((sum, p) => sum + p.attendancePercentage, 0) / recentPerformance.length;
  const avgMarks = recentPerformance.reduce((sum, p) => sum + p.marks, 0) / recentPerformance.length;
  
  // Attendance suggestions
  if (avgAttendance < 75) {
    suggestions.push({
      category: 'attendance',
      priority: avgAttendance < 60 ? 'high' : 'medium',
      suggestion: 'Focus on improving attendance. Aim for at least 75% to meet minimum requirements.',
      expectedImpact: 'Prevents academic penalties and improves learning outcomes'
    });
  }
  
  // Performance suggestions
  if (avgMarks < 60) {
    suggestions.push({
      category: 'study-habits',
      priority: 'high',
      suggestion: 'Consider additional study hours and seek help from faculty or peers.',
      expectedImpact: 'Can improve grades by 10-15%'
    });
  }
  
  // Subject-specific suggestions
  const weakSubjects = recentPerformance.filter(p => p.marks < 50);
  if (weakSubjects.length > 0) {
    suggestions.push({
      category: 'subject-focus',
      priority: 'high',
      suggestion: `Focus on ${weakSubjects.length} weak subject(s): ${weakSubjects.map(s => s.subjectName).join(', ')}`,
      expectedImpact: 'Prevents subject failures'
    });
  }
  
  // Trend-based suggestions
  if (analytics.performanceTrend === 'declining') {
    suggestions.push({
      category: 'counseling',
      priority: 'high',
      suggestion: 'Performance is declining. Consider meeting with academic counselor.',
      expectedImpact: 'Early intervention can prevent further decline'
    });
  }
  
  // Time management
  if (avgAttendance < 80 && avgMarks < 70) {
    suggestions.push({
      category: 'time-management',
      priority: 'medium',
      suggestion: 'Improve time management skills. Create a study schedule and stick to it.',
      expectedImpact: 'Better balance between attendance and performance'
    });
  }
  
  analytics.suggestions = suggestions;
};

// Analyze individual subjects
const analyzeSubjects = async (analytics) => {
  const recentPerformance = await Performance.find({ studentId: analytics.studentId })
    .sort({ lastUpdated: -1 })
    .limit(20);
  
  const subjectMap = new Map();
  
  recentPerformance.forEach(perf => {
    if (!subjectMap.has(perf.subjectName)) {
      subjectMap.set(perf.subjectName, []);
    }
    subjectMap.get(perf.subjectName).push(perf);
  });
  
  const subjectAnalysis = [];
  
  for (const [subjectName, performances] of subjectMap) {
    const avgMarks = performances.reduce((sum, p) => sum + p.marks, 0) / performances.length;
    const latestMarks = performances[0].marks;
    
    // Simple prediction: weighted average of recent performance
    const predictedMarks = (latestMarks * 0.6) + (avgMarks * 0.4);
    
    // Determine difficulty based on average marks
    let difficulty = 'moderate';
    if (avgMarks < 50) difficulty = 'very-difficult';
    else if (avgMarks < 65) difficulty = 'difficult';
    else if (avgMarks > 80) difficulty = 'easy';
    
    // Calculate failure risk
    const failureRisk = latestMarks < 40 ? 80 : latestMarks < 50 ? 50 : latestMarks < 60 ? 20 : 5;
    
    // Recommendation
    let recommendedAction = 'Maintain current performance';
    if (failureRisk > 50) recommendedAction = 'Urgent: Seek immediate help from faculty';
    else if (failureRisk > 20) recommendedAction = 'Focus more time on this subject';
    else if (avgMarks > 85) recommendedAction = 'Excellent! Consider helping peers';
    
    subjectAnalysis.push({
      subjectName,
      currentMarks: latestMarks,
      predictedMarks: Math.round(predictedMarks),
      difficulty,
      failureRisk,
      recommendedAction
    });
  }
  
  analytics.subjectAnalysis = subjectAnalysis;
};

// Compare with peers
const comparePeers = async (analytics) => {
  const student = await Student.findById(analytics.studentId);
  if (!student) return;
  
  const academicRecord = await AcademicRecord.findOne({ studentId: analytics.studentId });
  if (!academicRecord || !academicRecord.cgpa) return;
  
  // Get department rankings
  const departmentRankings = await AcademicRecord.aggregate([
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
      $match: {
        'student.department': student.department,
        'student.status': 'active',
        cgpa: { $gt: 0 }
      }
    },
    { $sort: { cgpa: -1 } },
    {
      $group: {
        _id: null,
        students: { $push: { studentId: '$studentId', cgpa: '$cgpa' } },
        avgCGPA: { $avg: '$cgpa' }
      }
    }
  ]);
  
  if (departmentRankings.length > 0) {
    const { students, avgCGPA } = departmentRankings[0];
    const rank = students.findIndex(s => s.studentId.toString() === analytics.studentId.toString()) + 1;
    const totalStudents = students.length;
    const percentile = ((totalStudents - rank + 1) / totalStudents) * 100;
    
    analytics.peerComparison = {
      departmentRank: rank,
      percentile: Math.round(percentile),
      aboveAverage: academicRecord.cgpa > avgCGPA
    };
  }
  
  // Get year rankings
  const yearRankings = await AcademicRecord.aggregate([
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
      $match: {
        'student.department': student.department,
        'student.year': student.year,
        'student.status': 'active',
        cgpa: { $gt: 0 }
      }
    },
    { $sort: { cgpa: -1 } }
  ]);
  
  const yearRank = yearRankings.findIndex(r => r.studentId.toString() === analytics.studentId.toString()) + 1;
  if (yearRank > 0) {
    analytics.peerComparison.yearRank = yearRank;
  }
};

// Batch analyze all students
const batchAnalyzeStudents = async (req, res) => {
  try {
    const { department, year, limit = 100 } = req.query;
    
    const query = { status: 'active' };
    if (department) query.department = department;
    if (year) query.year = parseInt(year);
    
    const students = await Student.find(query).limit(parseInt(limit)).select('_id');
    
    const results = [];
    for (const student of students) {
      try {
        const analytics = await runStudentAnalysis(student._id);
        results.push({
          studentId: student._id,
          riskLevel: analytics.riskLevel,
          riskScore: analytics.riskScore
        });
      } catch (error) {
        console.error(`Failed to analyze student ${student._id}:`, error);
      }
    }
    
    res.json({ success: true, data: { analyzed: results.length, results } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get at-risk students with AI insights
const getAtRiskStudentsAI = async (req, res) => {
  try {
    const { limit = 20, riskLevel } = req.query;
    
    const query = {};
    if (riskLevel) {
      query.riskLevel = riskLevel;
    } else {
      query.riskLevel = { $in: ['high', 'critical'] };
    }
    
    const atRiskStudents = await AIAnalytics.find(query)
      .sort({ riskScore: -1 })
      .limit(parseInt(limit))
      .populate('studentId', 'name studentId department year email');
    
    res.json({ success: true, data: atRiskStudents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get dashboard AI insights
const getDashboardInsights = async (req, res) => {
  try {
    const [
      totalAnalyzed,
      criticalRisk,
      highRisk,
      improvingStudents,
      decliningStudents
    ] = await Promise.all([
      AIAnalytics.countDocuments(),
      AIAnalytics.countDocuments({ riskLevel: 'critical' }),
      AIAnalytics.countDocuments({ riskLevel: 'high' }),
      AIAnalytics.countDocuments({ performanceTrend: 'improving' }),
      AIAnalytics.countDocuments({ performanceTrend: 'declining' })
    ]);
    
    // Get recent alerts
    const recentAlerts = await AIAnalytics.aggregate([
      { $unwind: '$alerts' },
      { $match: { 'alerts.acknowledged': false } },
      { $sort: { 'alerts.createdAt': -1 } },
      { $limit: 10 },
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
          studentName: '$student.name',
          studentId: '$student.studentId',
          alert: '$alerts'
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalAnalyzed,
          criticalRisk,
          highRisk,
          improvingStudents,
          decliningStudents
        },
        recentAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getStudentAnalytics,
  runStudentAnalysis,
  batchAnalyzeStudents,
  getAtRiskStudentsAI,
  getDashboardInsights
};
