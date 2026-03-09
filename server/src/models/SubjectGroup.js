const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const subjectGroupSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  subjects: [subjectSchema],
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

subjectGroupSchema.index({ department: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('SubjectGroup', subjectGroupSchema);
