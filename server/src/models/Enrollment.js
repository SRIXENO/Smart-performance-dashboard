const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  eligibleSubjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  status: { type: String, enum: ['active', 'completed', 'dropped'], default: 'active' }
}, { timestamps: true });

enrollmentSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });
enrollmentSchema.index({ studentId: 1, status: 1 });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
