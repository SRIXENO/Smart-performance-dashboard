const mongoose = require('mongoose');

// Subject Grade Schema for SGPA calculation
const subjectGradeSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  credits: { type: Number, required: true, min: 1, max: 6 },
  marks: { type: Number, required: true, min: 0, max: 100 },
  grade: { 
    type: String, 
    required: true, 
    enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F', 'Ab'] 
  },
  gradePoint: { type: Number, required: true, min: 0, max: 10 },
  creditPoints: { type: Number, required: true } // credits × gradePoint
}, { _id: false });

// Semester Record Schema
const semesterRecordSchema = new mongoose.Schema({
  semester: { type: String, required: true }, // e.g., "1", "2", "3", etc.
  year: { type: Number, required: true, min: 1, max: 4 },
  subjects: [subjectGradeSchema],
  totalCredits: { type: Number, required: true, default: 0 },
  totalCreditPoints: { type: Number, required: true, default: 0 },
  sgpa: { type: Number, required: true, min: 0, max: 10, default: 0 },
  attendancePercentage: { type: Number, min: 0, max: 100 },
  status: { 
    type: String, 
    enum: ['in-progress', 'completed', 'failed'], 
    default: 'in-progress' 
  },
  completedDate: { type: Date }
}, { _id: false });

// Main Academic Record Schema
const academicRecordSchema = new mongoose.Schema({
  studentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true, 
    unique: true 
  },
  semesters: [semesterRecordSchema],
  cgpa: { type: Number, min: 0, max: 10, default: 0 },
  totalCreditsEarned: { type: Number, default: 0 },
  totalCreditPointsEarned: { type: Number, default: 0 },
  currentSemester: { type: String },
  academicStatus: { 
    type: String, 
    enum: ['excellent', 'good', 'average', 'poor', 'probation'], 
    default: 'average' 
  },
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Grade to Grade Point mapping
const gradePointMap = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'P': 4,
  'F': 0,
  'Ab': 0
};

// Calculate grade from marks
academicRecordSchema.statics.calculateGrade = function(marks) {
  if (marks >= 90) return { grade: 'O', gradePoint: 10 };
  if (marks >= 80) return { grade: 'A+', gradePoint: 9 };
  if (marks >= 70) return { grade: 'A', gradePoint: 8 };
  if (marks >= 60) return { grade: 'B+', gradePoint: 7 };
  if (marks >= 50) return { grade: 'B', gradePoint: 6 };
  if (marks >= 40) return { grade: 'C', gradePoint: 5 };
  if (marks >= 35) return { grade: 'P', gradePoint: 4 };
  return { grade: 'F', gradePoint: 0 };
};

// Calculate SGPA for a semester
academicRecordSchema.methods.calculateSGPA = function(semesterIndex) {
  const semester = this.semesters[semesterIndex];
  if (!semester || semester.subjects.length === 0) return 0;

  let totalCredits = 0;
  let totalCreditPoints = 0;

  semester.subjects.forEach(subject => {
    totalCredits += subject.credits;
    totalCreditPoints += subject.creditPoints;
  });

  semester.totalCredits = totalCredits;
  semester.totalCreditPoints = totalCreditPoints;
  semester.sgpa = totalCredits > 0 ? (totalCreditPoints / totalCredits) : 0;

  return semester.sgpa;
};

// Calculate CGPA from all completed semesters
academicRecordSchema.methods.calculateCGPA = function() {
  const completedSemesters = this.semesters.filter(s => s.status === 'completed');
  
  if (completedSemesters.length === 0) return 0;

  let totalCredits = 0;
  let totalCreditPoints = 0;

  completedSemesters.forEach(semester => {
    totalCredits += semester.totalCredits;
    totalCreditPoints += semester.totalCreditPoints;
  });

  this.totalCreditsEarned = totalCredits;
  this.totalCreditPointsEarned = totalCreditPoints;
  this.cgpa = totalCredits > 0 ? (totalCreditPoints / totalCredits) : 0;

  // Update academic status based on CGPA
  if (this.cgpa >= 9) this.academicStatus = 'excellent';
  else if (this.cgpa >= 7.5) this.academicStatus = 'good';
  else if (this.cgpa >= 6) this.academicStatus = 'average';
  else if (this.cgpa >= 5) this.academicStatus = 'poor';
  else this.academicStatus = 'probation';

  return this.cgpa;
};

// Get year-wise SGPA (average of 2 semesters per year)
academicRecordSchema.methods.getYearWiseSGPA = function() {
  const yearData = {};
  
  this.semesters.forEach(semester => {
    if (semester.status === 'completed') {
      if (!yearData[semester.year]) {
        yearData[semester.year] = { semesters: [], totalSGPA: 0, count: 0 };
      }
      yearData[semester.year].semesters.push(semester.sgpa);
      yearData[semester.year].totalSGPA += semester.sgpa;
      yearData[semester.year].count += 1;
    }
  });

  const result = [];
  for (const [year, data] of Object.entries(yearData)) {
    result.push({
      year: parseInt(year),
      sgpa: data.count > 0 ? (data.totalSGPA / data.count) : 0,
      semesters: data.semesters
    });
  }

  return result.sort((a, b) => a.year - b.year);
};

academicRecordSchema.index({ studentId: 1 });
academicRecordSchema.index({ cgpa: -1 });
academicRecordSchema.index({ academicStatus: 1 });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
