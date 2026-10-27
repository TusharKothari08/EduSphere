const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getStripe } = require('../services/stripe');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const { fulfillPaidCheckoutSession } = require('../services/stripePayments');

const router = express.Router();

// Safe return-page verification. A browser redirect alone grants no access;
// the Stripe session is checked server-to-server before reconciliation.
router.get('/session/:sessionId', requireAuth, async (req, res, next) => {
  try {
    const sessionId = String(req.params.sessionId || '');
    const existing = await Payment.findOne({ stripeSessionId: sessionId, user: req.user._id });
    if (existing?.status === 'succeeded') {
      const enrollment = await Enrollment.findOne({ user: req.user._id, course: existing.course });
      if (enrollment) return res.json({ status: 'confirmed', courseId: String(existing.course) });
      // A previous webhook may have recorded the payment before enrollment completed.
      // Continue below and reconcile from Stripe's server-verified session.
    }

    const stripe = getStripe();
    if (!stripe) return res.json({ status: 'processing' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== String(req.user._id)) return res.status(403).json({ message: 'This checkout session does not belong to your account.' });
    if (session.status !== 'complete' || session.payment_status !== 'paid') return res.json({ status: 'processing' });
    const courseId = session.metadata?.courseId;
    if (!courseId) return res.status(400).json({ message: 'Course details were missing from the checkout session.' });

    const fulfilledCourseId = await fulfillPaidCheckoutSession(session);
    if (!fulfilledCourseId) return res.json({ status: 'processing' });
    res.json({ status: 'confirmed', courseId: fulfilledCourseId });
  } catch (error) { next(error); }
});

module.exports = router;
