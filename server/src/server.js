require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { clerkMiddleware } = require('@clerk/express');
const connectDatabase = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const enrollmentRoutes = require('./routes/enrollments');
const educatorRoutes = require('./routes/educator');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/uploads');
const paymentRoutes = require('./routes/payments');
const learningRoutes = require('./routes/learning');
const adminRoutes = require('./routes/admin');
const { getStripe } = require('./services/stripe');
const Payment = require('./models/Payment');
const { fulfillPaidCheckoutSession } = require('./services/stripePayments');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://edunexa-u34x.onrender.com",
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: 'draft-7', legacyHeaders: false }));

if (process.env.CLERK_SECRET_KEY) {
  app.use((req, res, next) => {
    if (req.path === '/api/health' || req.path === '/api/webhooks/stripe') {
      return next();
    }
    return clerkMiddleware()(req, res, next);
  });
}

// Stripe requires the exact raw request body for signature verification; keep this before express.json().
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Stripe webhook is not configured.');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.warn('Rejected Stripe webhook signature:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      // The helper validates the paid session and is safe to run repeatedly as
      // Stripe retries webhook delivery.
      await fulfillPaidCheckoutSession(event.data.object);
    } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      await Payment.findOneAndUpdate({ stripeSessionId: session.id, status: { $ne: 'succeeded' } }, { $set: { status: 'failed' } });
    }
    return res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    // A 500 response asks Stripe to retry delivery; the database writes above are idempotent.
    return res.status(500).json({ message: 'Webhook processing failed.' });
  }
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Edemy LMS API', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Some course information is invalid.', details: Object.values(error.errors).map((item) => item.message) });
  if (error.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier.' });
  if (error.name === 'MulterError') return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : error.message });
  console.error(error);
  return res.status(500).json({ message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : (error.message || 'Unexpected server error.') });
});

const port = Number(process.env.PORT || 5000);
connectDatabase().then(() => {
  app.listen(port, () => console.log(`Edemy LMS API listening on http://localhost:${port}`));
}).catch((error) => {
  console.error('Unable to start Edemy LMS API:', error.message);
  process.exit(1);
});

module.exports = app;
