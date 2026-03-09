const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectId: { type: String, unique: true, required: true },
  subjectName: { type: String, required: true, maxlength: 100 },
  subjectCode: { type: String, required: true, uppercase: true, maxlength: 20 },
  credits: { type: Number, required: true, min: 1, max: 6 },
  department: { 
    type: String, 
    required: true, 
    enum: [
      'Computer Science',
      'Information Technology',
      'Electrical and Communication Engineering',
      'Electrical and Electronic Engineering',
      'Mechanical',
      'Civil',
      'Biotechnology'
    ] 
  },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  year: { type: Number, min: 1, max: 4 },
  semester: { type: Number, min: 1, max: 8 }
}, {
  timestamps: true
});

subjectSchema.index({ subjectCode: 1, department: 1, year: 1, semester: 1 }, { unique: true });
subjectSchema.index({ department: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
