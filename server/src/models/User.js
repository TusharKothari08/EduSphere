const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 100, default: 'Learner' },
  email: { type: String, trim: true, lowercase: true, sparse: true, unique: true },
  passwordHash: { type: String, select: false },
  clerkId: { type: String, sparse: true, unique: true },
  role: { type: String, enum: ['student', 'educator', 'admin'], default: 'student' },
  active: { type: Boolean, default: true },
  avatarUrl: { type: String, default: '' }
}, { timestamps: true });

userSchema.index({ role: 1 });
module.exports = mongoose.model('User', userSchema);
