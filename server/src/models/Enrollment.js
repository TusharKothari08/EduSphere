const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  paymentStatus: { type: String, enum: ['free', 'paid', 'demo'], required: true },
  completedLessonIds: { type: [String], default: [] },
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null }
}, { timestamps: true });

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
module.exports = mongoose.model('Enrollment', enrollmentSchema);
