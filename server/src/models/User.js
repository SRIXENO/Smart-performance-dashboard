const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  name: { type: String, required: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  role: { type: String, required: true, enum: ['admin', 'faculty', 'student', 'viewer'], default: 'student' },
  googleId: { type: String, unique: true, sparse: true },
  avatar: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (this.authProvider === 'google' || !this.password) return;
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
