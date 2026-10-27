const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');

// Stripe expects amounts in the currency's minor unit. Most currencies use 2
// decimal places; these currencies use 0, while ISK and UGX retain the API's
// backwards-compatible 2-digit representation despite having no fractional
// units in normal pricing.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF',
  'VND', 'VUV', 'XAF', 'XOF', 'XPF'
]);
const TWO_DIGIT_COMPAT_CURRENCIES = new Set(['ISK', 'UGX']);

function currencyFactor(currency) {
  const code = String(currency || 'usd').trim().toUpperCase();
  if (TWO_DIGIT_COMPAT_CURRENCIES.has(code)) return 100;
  return ZERO_DECIMAL_CURRENCIES.has(code) ? 1 : 100;
}

function toMinorUnits(amount, currency) {
  const numericAmount = Number(amount);
  const factor = currencyFactor(currency);
  const code = String(currency || 'usd').trim().toUpperCase();
  const converted = numericAmount * factor;
  const fractionalZeroDecimalPrice = (ZERO_DECIMAL_CURRENCIES.has(code) || TWO_DIGIT_COMPAT_CURRENCIES.has(code)) && !Number.isInteger(numericAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || fractionalZeroDecimalPrice || !Number.isSafeInteger(Math.round(converted)) || Math.abs(converted - Math.round(converted)) > 1e-7) {
    throw new Error(`Course price must be positive and use the supported precision for ${String(currency || 'usd').toUpperCase()}.`);
  }
  return Math.round(converted);
}

function fromMinorUnits(amount, currency) {
  return Number(amount) / currencyFactor(currency);
}

/**
 * Idempotently records a paid Stripe Checkout Session and grants course access.
 * Call only after retrieving a session from Stripe or verifying Stripe's webhook
 * signature; never call based on client-provided payment status.
 */
async function fulfillPaidCheckoutSession(session) {
  if (!session || session.mode !== 'payment' || session.status !== 'complete' || session.payment_status !== 'paid') {
    return null;
  }

  const userId = String(session.metadata?.userId || '');
  const courseId = String(session.metadata?.courseId || '');
  if (!session.id || !mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(courseId)) {
    throw new Error('Paid Stripe session is missing valid user or course metadata.');
  }
  if (session.amount_total == null || !Number.isSafeInteger(Number(session.amount_total)) || Number(session.amount_total) <= 0) {
    throw new Error('Paid Stripe session is missing a valid total amount.');
  }

  const currency = String(session.currency || process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
  const amount = fromMinorUnits(Number(session.amount_total), currency);
  const existing = await Payment.findOne({ stripeSessionId: session.id });

  // A session must never be reassigned to another learner or course.
  if (existing && (String(existing.user) !== userId || String(existing.course) !== courseId)) {
    throw new Error('Stripe session metadata does not match its payment record.');
  }
  if (existing && (String(existing.currency || '').toLowerCase() !== currency || Math.abs(Number(existing.amount) - amount) > 1e-7)) {
    throw new Error('Stripe session total does not match its recorded payment amount.');
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : (session.payment_intent?.id || '');

  await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      $set: {
        paymentIntentId,
        status: 'succeeded',
        amount,
        currency,
        receiptEmail: session.customer_details?.email || session.customer_email || existing?.receiptEmail || ''
      },
      $setOnInsert: { user: userId, course: courseId, stripeSessionId: session.id }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Enrollment.findOneAndUpdate(
    { user: userId, course: courseId },
    { $setOnInsert: { user: userId, course: courseId, paymentStatus: 'paid' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return courseId;
}

module.exports = { toMinorUnits, fromMinorUnits, fulfillPaidCheckoutSession };
