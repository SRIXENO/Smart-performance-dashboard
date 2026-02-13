const mongoose = require('mongoose');

// AI Prediction Schema
const aiAnalyticsSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  
  // Risk Assessment
  riskScore: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100,
    default: 0 
  },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  riskFactors: [{
    factor: { type: String, required: true },
    impact: { type: String, enum: ['low', 'medium', 'high'] },
    value: { type: Number }
  }],
  
  // Performance Predictions
  predictedCGPA: { type: Number, min: 0, max: 10 },
  predictedNextSemesterSGPA: { type: Number, min: 0, max: 10 },
  predictedFinalGrade: { type: String },
  confidenceScore: { type: Number, min: 0, max: 100 },
  
  // Trend Analysis
  attendanceTrend: { 
    type: String, 
    enum: ['improving', 'stable', 'declining', 'critical'] 
  },
  performanceTrend: { 
    type: String, 
    enum: ['improving', 'stable', 'declining', 'critical'] 
  },
  
  // Historical Data Points
  historicalData: [{
    semester: { type: String },
    sgpa: { type: Number },
    attendance: { type: Number },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Smart Alerts
  alerts: [{
    type: { 
      type: String, 
      enum: ['attendance', 'performance', 'subject-failure', 'probation-risk', 'improvement'] 
    },
    severity: { 
      type: String, 
      enum: ['info', 'warning', 'danger', 'critical'] 
    },
    message: { type: String, required: true },
    actionRequired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    acknowledged: { type: Boolean, default: false }
  }],
  
  // Improvement Suggestions
  suggestions: [{
    category: { 
      type: String, 
      enum: ['attendance', 'study-habits', 'subject-focus', 'time-management', 'counseling'] 
    },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    suggestion: { type: String, required: true },
    expectedImpact: { type: String }
  }],
  
  // Subject-wise Analysis
  subjectAnalysis: [{
    subjectName: { type: String, required: true },
    currentMarks: { type: Number },
    predictedMarks: { type: Number },
    difficulty: { type: String, enum: ['easy', 'moderate', 'difficult', 'very-difficult'] },
    failureRisk: { type: Number, min: 0, max: 100 },
    recommendedAction: { type: String }
  }],
  
  // Peer Comparison
  peerComparison: {
    departmentRank: { type: Number },
    yearRank: { type: Number },
    percentile: { type: Number, min: 0, max: 100 },
    aboveAverage: { type: Boolean }
  },
  
  // Engagement Metrics
  engagementScore: { type: Number, min: 0, max: 100, default: 50 },
  lastActive: { type: Date },
  
  // Analysis Metadata
  lastAnalyzed: { type: Date, default: Date.now },
  analysisVersion: { type: String, default: '1.0' },
  dataQuality: { type: Number, min: 0, max: 100, default: 100 }
  
}, {
  timestamps: true
});

// Calculate risk score based on multiple factors
aiAnalyticsSchema.methods.calculateRiskScore = async function() {
  const Student = mongoose.model('Student');
  const AcademicRecord = mongoose.model('AcademicRecord');
  const Performance = mongoose.model('Performance');
  
  const student = await Student.findById(this.studentId);
  const academicRecord = await AcademicRecord.findOne({ studentId: this.studentId });
  const recentPerformance = await Performance.find({ studentId: this.studentId })
    .sort({ lastUpdated: -1 })
    .limit(5);
  
  let riskScore = 0;
  const riskFactors = [];
  
  // Factor 1: Attendance (40% weight)
  if (recentPerformance.length > 0) {
    const avgAttendance = recentPerformance.reduce((sum, p) => sum + p.attendancePercentage, 0) / recentPerformance.length;
    if (avgAttendance < 50) {
      riskScore += 40;
      riskFactors.push({ factor: 'Critical Attendance', impact: 'high', value: avgAttendance });
    } else if (avgAttendance < 65) {
      riskScore += 25;
      riskFactors.push({ factor: 'Low Attendance', impact: 'medium', value: avgAttendance });
    } else if (avgAttendance < 75) {
      riskScore += 10;
      riskFactors.push({ factor: 'Below Average Attendance', impact: 'low', value: avgAttendance });
    }
  }
  
  // Factor 2: Academic Performance (40% weight)
  if (academicRecord && academicRecord.cgpa) {
    if (academicRecord.cgpa < 5) {
      riskScore += 40;
      riskFactors.push({ factor: 'Critical CGPA', impact: 'high', value: academicRecord.cgpa });
    } else if (academicRecord.cgpa < 6) {
      riskScore += 25;
      riskFactors.push({ factor: 'Low CGPA', impact: 'medium', value: academicRecord.cgpa });
    } else if (academicRecord.cgpa < 7) {
      riskScore += 10;
      riskFactors.push({ factor: 'Below Average CGPA', impact: 'low', value: academicRecord.cgpa });
    }
  }
  
  // Factor 3: Recent Performance Trend (20% weight)
  if (recentPerformance.length >= 3) {
    const recentMarks = recentPerformance.slice(0, 3).map(p => p.marks);
    const isDecreasing = recentMarks[0] < recentMarks[1] && recentMarks[1] < recentMarks[2];
    if (isDecreasing) {
      riskScore += 20;
      riskFactors.push({ factor: 'Declining Performance', impact: 'high', value: recentMarks[0] });
    }
  }
  
  this.riskScore = Math.min(riskScore, 100);
  this.riskFactors = riskFactors;
  
  // Set risk level
  if (this.riskScore >= 75) this.riskLevel = 'critical';
  else if (this.riskScore >= 50) this.riskLevel = 'high';
  else if (this.riskScore >= 25) this.riskLevel = 'medium';
  else this.riskLevel = 'low';
  
  return this.riskScore;
};

// Generate smart alerts
aiAnalyticsSchema.methods.generateAlerts = async function() {
  const Performance = mongoose.model('Performance');
  const AcademicRecord = mongoose.model('AcademicRecord');
  
  const alerts = [];
  const recentPerformance = await Performance.find({ studentId: this.studentId })
    .sort({ lastUpdated: -1 })
    .limit(5);
  
  const academicRecord = await AcademicRecord.findOne({ studentId: this.studentId });
  
  // Attendance alerts
  if (recentPerformance.length > 0) {
    const avgAttendance = recentPerformance.reduce((sum, p) => sum + p.attendancePercentage, 0) / recentPerformance.length;
    if (avgAttendance < 60) {
      alerts.push({
        type: 'attendance',
        severity: 'critical',
        message: `Critical: Attendance at ${avgAttendance.toFixed(1)}%. Immediate action required.`,
        actionRequired: true
      });
    } else if (avgAttendance < 75) {
      alerts.push({
        type: 'attendance',
        severity: 'warning',
        message: `Warning: Attendance at ${avgAttendance.toFixed(1)}%. Below minimum requirement.`,
        actionRequired: true
      });
    }
  }
  
  // Performance alerts
  if (academicRecord && academicRecord.cgpa < 5.5) {
    alerts.push({
      type: 'probation-risk',
      severity: 'danger',
      message: `Academic probation risk. Current CGPA: ${academicRecord.cgpa.toFixed(2)}`,
      actionRequired: true
    });
  }
  
  // Subject failure alerts
  const failingSubjects = recentPerformance.filter(p => p.marks < 40);
  if (failingSubjects.length > 0) {
    alerts.push({
      type: 'subject-failure',
      severity: 'danger',
      message: `${failingSubjects.length} subject(s) at risk of failure`,
      actionRequired: true
    });
  }
  
  this.alerts = alerts;
  return alerts;
};

// Predict future performance
aiAnalyticsSchema.methods.predictPerformance = async function() {
  const AcademicRecord = mongoose.model('AcademicRecord');
  const Performance = mongoose.model('Performance');
  
  const academicRecord = await AcademicRecord.findOne({ studentId: this.studentId });
  const recentPerformance = await Performance.find({ studentId: this.studentId })
    .sort({ lastUpdated: -1 })
    .limit(10);
  
  if (!academicRecord || recentPerformance.length < 3) {
    this.predictedCGPA = academicRecord?.cgpa || 0;
    this.predictedNextSemesterSGPA = academicRecord?.cgpa || 0;
    this.confidenceScore = 30;
    return;
  }
  
  // Simple linear regression for prediction
  const sgpaHistory = academicRecord.semesters
    .filter(s => s.status === 'completed')
    .map(s => s.sgpa);
  
  if (sgpaHistory.length >= 2) {
    const recentSGPAs = sgpaHistory.slice(-3);
    const avgRecent = recentSGPAs.reduce((a, b) => a + b, 0) / recentSGPAs.length;
    const trend = sgpaHistory[sgpaHistory.length - 1] - sgpaHistory[sgpaHistory.length - 2];
    
    this.predictedNextSemesterSGPA = Math.max(0, Math.min(10, avgRecent + (trend * 0.5)));
    this.predictedCGPA = Math.max(0, Math.min(10, academicRecord.cgpa + (trend * 0.3)));
    this.confidenceScore = Math.min(90, 50 + (sgpaHistory.length * 5));
  } else {
    this.predictedCGPA = academicRecord.cgpa;
    this.predictedNextSemesterSGPA = academicRecord.cgpa;
    this.confidenceScore = 40;
  }
  
  // Predict final grade
  if (this.predictedCGPA >= 9) this.predictedFinalGrade = 'First Class with Distinction';
  else if (this.predictedCGPA >= 7.5) this.predictedFinalGrade = 'First Class';
  else if (this.predictedCGPA >= 6) this.predictedFinalGrade = 'Second Class';
  else if (this.predictedCGPA >= 5) this.predictedFinalGrade = 'Pass Class';
  else this.predictedFinalGrade = 'At Risk';
};

aiAnalyticsSchema.index({ studentId: 1 });
aiAnalyticsSchema.index({ riskLevel: 1 });
aiAnalyticsSchema.index({ riskScore: -1 });
aiAnalyticsSchema.index({ lastAnalyzed: -1 });

module.exports = mongoose.model('AIAnalytics', aiAnalyticsSchema);
