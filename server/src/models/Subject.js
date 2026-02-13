const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  subjectId: { type: String, unique: true, required: true },
  subjectName: { type: String, required: true, maxlength: 100 },
  subjectCode: { type: String, required: true, unique: true, uppercase: true, maxlength: 20 },
  credits: { type: Number, required: true, min: 1, max: 6 },
  department: { 
    type: String, 
    required: true, 
    enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil'] 
  },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);