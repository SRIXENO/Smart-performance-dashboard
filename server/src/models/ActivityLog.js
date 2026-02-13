const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userRole: { type: String, enum: ['admin', 'faculty', 'student', 'system'] },
  userName: { type: String },
  
  // What action was performed
  action: { 
    type: String, 
    required: true,
    enum: [
      'student_created', 'student_updated', 'student_deleted',
      'performance_added', 'performance_updated', 'performance_deleted',
      'subject_assigned', 'subject_updated', 'subject_removed',
      'grade_updated', 'attendance_updated',
      'semester_completed', 'cgpa_calculated',
      'alert_generated', 'report_exported',
      'login', 'logout',
      'data_imported', 'bulk_update',
      'system_analysis', 'ai_prediction'
    ]
  },
  
  // Target of the action
  targetType: { 
    type: String, 
    enum: ['student', 'performance', 'subject', 'academic_record', 'system'] 
  },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String },
  
  // Details
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Changes made (for audit trail)
  changes: {
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed }
  },
  
  // Context
  ipAddress: { type: String },
  userAgent: { type: String },
  
  // Status
  status: { 
    type: String, 
    enum: ['success', 'failed', 'pending'], 
    default: 'success' 
  },
  errorMessage: { type: String },
  
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: true
});

// Indexes for efficient querying
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ targetId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ timestamp: -1 });

// Static method to log activity
activityLogSchema.statics.log = async function(data) {
  try {
    const log = new this(data);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to create activity log:', error);
    return null;
  }
};

// Get student timeline
activityLogSchema.statics.getStudentTimeline = async function(studentId, limit = 50) {
  return this.find({ targetId: studentId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Get recent activities
activityLogSchema.statics.getRecentActivities = async function(limit = 100) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
