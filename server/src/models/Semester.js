const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  semesterId: { type: String, required: true, unique: true },
  semesterNumber: { type: Number, required: true, min: 1, max: 8 },
  year: { type: Number, required: true, min: 1, max: 4 },
  label: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

semesterSchema.index({ semesterNumber: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema);
