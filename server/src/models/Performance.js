const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
  year: { type: Number, min: 1, max: 4 },
  subjectName: { type: String, required: true },
  attendancePercentage: { type: Number, required: true, min: 0, max: 100 },
  marks: { type: Number, required: true, min: 0, max: 100 },
  grade: { type: String, required: true, enum: ['A', 'B', 'C', 'D', 'F'] },
  semester: { type: String, required: true },
  lastUpdated: { type: Date, required: true, default: Date.now }
});

performanceSchema.index({ studentId: 1, subjectName: 1, semester: 1 }, { unique: true });
performanceSchema.index({ studentId: 1, subjectId: 1, semesterId: 1 }, { unique: true, sparse: true });
performanceSchema.index({ studentId: 1, semester: 1, lastUpdated: -1 });
performanceSchema.index({ departmentId: 1, year: 1, semesterId: 1, lastUpdated: -1 });
performanceSchema.index({ lastUpdated: -1 });

performanceSchema.pre('validate', function() {
  // Auto-calculate grade based on marks
  if (this.marks >= 90) this.grade = 'A';
  else if (this.marks >= 80) this.grade = 'B';
  else if (this.marks >= 70) this.grade = 'C';
  else if (this.marks >= 60) this.grade = 'D';
  else this.grade = 'F';
  
  this.lastUpdated = new Date();
});

module.exports = mongoose.model('Performance', performanceSchema);
