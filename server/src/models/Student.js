const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, unique: true, required: true },
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  department: { 
    type: String, 
    required: true, 
    enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Biotechnology'] 
  },
  year: { type: Number, required: true, min: 1, max: 4 },
  semester: { type: Number },
  currentSemester: { type: String },
  phone: { type: String },
  alternatePhone: { type: String },
  emergencyContact: { type: String },
  dateOfBirth: { type: Date },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, required: true, enum: ['active', 'inactive', 'graduated', 'suspended'], default: 'active' },
  
  // Personal Info
  gender: { type: String },
  bloodGroup: { type: String },
  nationality: { type: String },
  religion: { type: String },
  category: { type: String },
  maritalStatus: { type: String },
  languages: [{ type: String }],
  
  // Address
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  permanentAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  currentAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  
  // Guardian Information
  guardianName: { type: String },
  guardianPhone: { type: String },
  guardianEmail: { type: String },
  guardianRelation: { type: String },
  guardianOccupation: { type: String },
  fatherName: { type: String },
  fatherOccupation: { type: String },
  fatherPhone: { type: String },
  fatherEmail: { type: String },
  fatherIncome: { type: String },
  motherName: { type: String },
  motherOccupation: { type: String },
  motherPhone: { type: String },
  motherEmail: { type: String },
  motherIncome: { type: String },
  
  // Academic Info
  program: { type: String },
  batch: { type: String },
  section: { type: String },
  rollNumber: { type: String },
  expectedGraduation: { type: String },
  admissionType: { type: String },
  previousEducation: { type: String },
  previousInstitution: { type: String },
  previousPercentage: { type: String },
  subjects: [{ type: String }],
  
  // Performance Stats
  cgpa: { type: String },
  currentCGPA: { type: Number, min: 0, max: 10, default: 0 },
  attendance: { type: String },
  currentAttendance: { type: Number, min: 0, max: 100, default: 0 },
  creditsEarned: { type: String },
  totalCreditsEarned: { type: Number, default: 0 },
  backlogs: { type: Number, default: 0 },
  sgpa: { type: Map, of: String },
  
  // Profile
  profileImage: { type: String },
  bio: { type: String, maxlength: 500 },
  
  // Metadata
  lastActive: { type: Date },
  tags: [{ type: String }]
}, {
  timestamps: true,
  strict: false
});

studentSchema.index({ department: 1, year: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ currentCGPA: -1 });

module.exports = mongoose.model('Student', studentSchema);