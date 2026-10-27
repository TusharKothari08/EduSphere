const express = require('express');
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { requireEducator } = require('../middleware/roles');
const { getStripe } = require('../services/stripe');
const { toMinorUnits, fromMinorUnits } = require('../services/stripePayments');

const router = express.Router();

const toSlug = (value) => String(value || 'course').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 65) || 'course';
const safeSections = (sections = [], hideLockedUrls = true) => sections.map((section) => ({
  _id: section._id,
  title: section.title,
  lessons: section.lessons.map((lesson) => ({
    _id: lesson._id,
    title: lesson.title,
    description: lesson.description,
    durationMinutes: lesson.durationMinutes,
    isPreview: lesson.isPreview,
    resources: lesson.resources,
    videoUrl: (!hideLockedUrls || lesson.isPreview) ? lesson.videoUrl : ''
  }))
}));
const publicCourse = (course) => {
  const raw = course.toObject ? course.toObject() : course;
  raw.sections = safeSections(raw.sections || [], true);
  raw.lessonCount = (course.sections || []).reduce((total, section) => total + section.lessons.length, 0);
  return raw;
};

router.get('/', async (req, res, next) => {
  try {
    const { q = '', category = '', level = '', sort = 'newest', page = 1, limit = 12 } = req.query;
    const filter = { published: true };
    if (category && category !== 'All categories') filter.category = category;
    if (level && level !== 'All levels') filter.level = level;
    if (q.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { subtitle: { $regex: escaped, $options: 'i' } },
        { description: { $regex: escaped, $options: 'i' } },
        { tags: { $regex: escaped, $options: 'i' } }
      ];
    }
    const sortMap = { newest: { createdAt: -1 }, price_low: { price: 1 }, price_high: { price: -1 }, rating: { averageRating: -1 } };
    const safeLimit = Math.min(30, Math.max(1, Number(limit) || 12));
    const safePage = Math.max(1, Number(page) || 1);
    const [courses, total] = await Promise.all([
      Course.find(filter).populate('educator', 'name').sort(sortMap[sort] || sortMap.newest).skip((safePage - 1) * safeLimit).limit(safeLimit),
      Course.countDocuments(filter)
    ]);
    res.json({ courses: courses.map(publicCourse), pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } });
  } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Course not found.' });
    const course = await Course.findById(req.params.id).populate('educator', 'name avatarUrl');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const isOwner = req.user && String(course.educator?._id || course.educator) === String(req.user._id);
    if (!course.published && !isOwner) return res.status(404).json({ message: 'Course not found.' });
    res.json({ course: publicCourse(course) });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, requireEducator, async (req, res, next) => {
  try {
    const { title, subtitle, description, category, level, language, price, thumbnail, tags, sections, published } = req.body;
    if (!String(title || '').trim() || !String(description || '').trim()) return res.status(400).json({ message: 'Course title and description are required.' });
    const courseSlug = `${toSlug(title)}-${Date.now().toString(36)}`;
    const cleanedSections = Array.isArray(sections) ? sections.map((section) => ({
      title: String(section.title || 'Course content').trim(),
      lessons: Array.isArray(section.lessons) ? section.lessons.map((lesson) => ({
        title: String(lesson.title || '').trim(),
        description: String(lesson.description || '').trim(),
        videoUrl: String(lesson.videoUrl || '').trim(),
        durationMinutes: Math.max(0, Number(lesson.durationMinutes) || 0),
        isPreview: Boolean(lesson.isPreview),
        resources: Array.isArray(lesson.resources) ? lesson.resources.slice(0, 10) : []
      })).filter((lesson) => lesson.title) : []
    })).filter((section) => section.title) : [];
    if (cleanedSections.length === 0 || cleanedSections.every((section) => section.lessons.length === 0)) {
      return res.status(400).json({ message: 'Add at least one section containing a lesson.' });
    }
    const course = await Course.create({
      title: String(title).trim(), slug: courseSlug, subtitle: String(subtitle || '').trim(), description: String(description).trim(),
      category: String(category || 'Development').trim(), level: ['Beginner', 'Intermediate', 'Advanced', 'All levels'].includes(level) ? level : 'Beginner',
      language: String(language || 'English').trim(), price: Math.max(0, Number(price) || 0), thumbnail: String(thumbnail || '').trim(),
      tags: Array.isArray(tags) ? tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 12) : [],
      sections: cleanedSections, educator: req.user._id, published: Boolean(published)
    });
    res.status(201).json({ course: publicCourse(course) });
  } catch (error) { next(error); }
});

router.put('/:id', requireAuth, requireEducator, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (String(course.educator) !== String(req.user._id)) return res.status(403).json({ message: 'You can only edit your own courses.' });
    const allowed = ['title', 'subtitle', 'description', 'category', 'level', 'language', 'thumbnail', 'published'];
    for (const key of allowed) if (req.body[key] !== undefined) course[key] = req.body[key];
    if (req.body.price !== undefined) course.price = Math.max(0, Number(req.body.price) || 0);
    if (req.body.tags !== undefined && Array.isArray(req.body.tags)) course.tags = req.body.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
    if (req.body.sections !== undefined && Array.isArray(req.body.sections)) {
      course.sections = req.body.sections.map((section) => ({
        _id: section._id,
        title: String(section.title || 'Course content').trim(),
        lessons: (section.lessons || []).filter((lesson) => lesson.title).map((lesson) => ({
          _id: lesson._id,
          title: String(lesson.title).trim(), description: String(lesson.description || ''), videoUrl: String(lesson.videoUrl || ''),
          durationMinutes: Math.max(0, Number(lesson.durationMinutes) || 0), isPreview: Boolean(lesson.isPreview), resources: lesson.resources || []
        }))
      }));
    }
    await course.save();
    res.json({ course: publicCourse(course) });
  } catch (error) { next(error); }
});

router.delete('/:id', requireAuth, requireEducator, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, educator: req.user._id });
    if (!course) return res.status(404).json({ message: 'Course not found or you do not own it.' });
    const enrollments = await Enrollment.countDocuments({ course: course._id });
    if (enrollments > 0) return res.status(409).json({ message: 'This course has learners. Unpublish it instead of deleting it.' });
    await course.deleteOne();
    res.json({ message: 'Course deleted.' });
  } catch (error) { next(error); }
});

router.post('/:id/checkout', requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, published: true });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (String(course.educator) === String(req.user._id)) return res.status(400).json({ message: 'Educators cannot purchase their own course.' });
    const existing = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (existing) return res.json({ enrolled: true, message: 'You already have access to this course.' });
    if (course.price === 0) {
      await Enrollment.create({ user: req.user._id, course: course._id, paymentStatus: 'free' });
      return res.json({ enrolled: true, message: 'You are enrolled in this free course.' });
    }

    const stripe = getStripe();
    if (!stripe && process.env.DEMO_MODE === 'true') {
      await Enrollment.create({ user: req.user._id, course: course._id, paymentStatus: 'demo' });
      await Payment.create({ user: req.user._id, course: course._id, amount: course.price, currency: process.env.STRIPE_CURRENCY || 'usd', status: 'succeeded' });
      return res.json({ enrolled: true, demo: true, message: 'Demo checkout completed. Course access is enabled.' });
    }
    if (!stripe) return res.status(503).json({ message: 'Payments are not configured. Add STRIPE_SECRET_KEY or enable demo mode.' });

    const currency = String(process.env.STRIPE_CURRENCY || 'usd').trim().toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      return res.status(500).json({ message: 'STRIPE_CURRENCY must be a three-letter currency code such as usd or inr.' });
    }
    let amountMinor;
    try {
      amountMinor = toMinorUnits(course.price, currency);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    // CLIENT_URL may contain multiple comma-separated origins for CORS. Stripe
    // needs exactly one absolute return URL, without a trailing slash.
    const clientUrl = String(process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/+$/, '');
    const userId = String(req.user._id);
    const courseId = String(course._id);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      client_reference_id: userId,
      line_items: [{ quantity: 1, price_data: {
        currency,
        unit_amount: amountMinor,
        product_data: { name: course.title, description: course.subtitle || course.description.slice(0, 250), ...(course.thumbnail ? { images: [course.thumbnail] } : {}) }
      }}],
      customer_email: req.user.email || undefined,
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/courses/${courseId}?payment=cancelled`,
      metadata: { userId, courseId },
      payment_intent_data: { metadata: { userId, courseId } }
    });

    // Use an upsert so a fast webhook cannot create a duplicate-key race with
    // this pending record. The webhook can mark it succeeded before this runs.
    await Payment.findOneAndUpdate(
      { stripeSessionId: session.id },
      { $setOnInsert: {
        user: req.user._id,
        course: course._id,
        stripeSessionId: session.id,
        amount: fromMinorUnits(amountMinor, currency),
        currency,
        status: 'pending',
        receiptEmail: req.user.email || ''
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ checkoutUrl: session.url });
  } catch (error) { next(error); }
});

router.get('/:id/content', requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('educator', 'name');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const isOwner = String(course.educator?._id || course.educator) === String(req.user._id);
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (!isOwner && !enrollment) return res.status(403).json({ message: 'Enroll in this course to access its lessons.' });
    res.json({ course: { ...course.toObject(), lessonCount: course.sections.reduce((n, s) => n + s.lessons.length, 0) }, enrollment });
  } catch (error) { next(error); }
});

router.post('/:id/lessons/:lessonId/complete', requireAuth, async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const allLessons = course.sections.flatMap((section) => section.lessons.map((lesson) => String(lesson._id)));
    if (!allLessons.includes(req.params.lessonId)) return res.status(404).json({ message: 'Lesson not found.' });
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    const isOwner = String(course.educator) === String(req.user._id);
    if (!enrollment && !isOwner) return res.status(403).json({ message: 'Enroll in this course before recording progress.' });
    if (isOwner) return res.json({ message: 'Educator preview does not record learner progress.', progressPercent: 0 });
    const completed = new Set(enrollment.completedLessonIds);
    completed.add(req.params.lessonId);
    enrollment.completedLessonIds = [...completed];
    enrollment.progressPercent = allLessons.length ? Math.round((completed.size / allLessons.length) * 100) : 0;
    if (enrollment.progressPercent === 100) enrollment.completedAt = new Date();
    await enrollment.save();
    res.json({ progressPercent: enrollment.progressPercent, completedLessonIds: enrollment.completedLessonIds });
  } catch (error) { next(error); }
});

module.exports = router;
