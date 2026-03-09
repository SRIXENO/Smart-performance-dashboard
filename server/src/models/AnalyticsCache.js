const mongoose = require('mongoose');

const analyticsCacheSchema = new mongoose.Schema({
  scope: { type: String, enum: ['global', 'student'], required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  metrics: { type: mongoose.Schema.Types.Mixed, required: true },
  computedAt: { type: Date, default: Date.now, index: true },
  ttlSeconds: { type: Number, default: 300 }
}, { timestamps: true });

analyticsCacheSchema.index({ scope: 1, studentId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AnalyticsCache', analyticsCacheSchema);
