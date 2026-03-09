const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const permissionSchema = new mongoose.Schema({
  studentsView: { type: Boolean, default: false },
  studentsManage: { type: Boolean, default: false },
  performanceView: { type: Boolean, default: false },
  performanceEdit: { type: Boolean, default: false },
  subjectsAssign: { type: Boolean, default: false },
  reportsExport: { type: Boolean, default: false },
  dashboardView: { type: Boolean, default: false },
  approvalsManage: { type: Boolean, default: false },
  viewersManage: { type: Boolean, default: false },
  facultyManage: { type: Boolean, default: false },
  importManage: { type: Boolean, default: false },
  activitiesView: { type: Boolean, default: false },
}, { _id: false });

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  tokenId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  lastUsedAt: { type: Date },
  revokedAt: { type: Date },
  replacedByTokenId: { type: String },
  userAgent: { type: String },
  ipAddress: { type: String },
}, { _id: false });

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  registerNumber: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String },
  role: { type: String, required: true, enum: ['admin', 'faculty', 'student', 'viewer'], default: 'student' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  department: { type: String, trim: true },
  designation: { type: String, trim: true, default: 'Faculty Member' },
  bio: { type: String, trim: true },
  expertise: [{ type: String }],
  profilePhoto: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  permissions: { type: permissionSchema, default: () => ({}) },
  refreshTokens: { type: [refreshTokenSchema], default: [] },
}, {
  timestamps: true
});

userSchema.index({ 'refreshTokens.tokenId': 1 });

userSchema.pre('save', async function() {
  if (this.authProvider === 'google' || !this.password) return;
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword || !this.password || typeof this.password !== 'string') {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
