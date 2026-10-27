const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  stripeSessionId: { type: String, unique: true, sparse: true },
  paymentIntentId: { type: String, default: '' },
  amount: { type: Number, min: 0, required: true },
  currency: { type: String, default: 'usd' },
  status: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
  receiptEmail: { type: String, default: '' }
}, { timestamps: true });

paymentSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Payment', paymentSchema);
