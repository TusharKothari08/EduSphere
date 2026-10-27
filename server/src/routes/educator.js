const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireEducator } = require('../middleware/roles');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');

const router = express.Router();
router.use(requireAuth, requireEducator);

router.get('/overview', async (req, res, next) => {
  try {
    const courses = await Course.find({ educator: req.user._id }).select('_id title published price createdAt');
    const ids = courses.map((course) => course._id);
    const [enrollments, revenueRows, recentEnrollments] = await Promise.all([
      Enrollment.countDocuments({ course: { $in: ids } }),
      Payment.aggregate([{ $match: { course: { $in: ids }, status: 'succeeded' } }, { $group: { _id: '$currency', total: { $sum: '$amount' } } }]),
      Enrollment.find({ course: { $in: ids } }).populate('user', 'name email').populate('course', 'title').sort({ createdAt: -1 }).limit(8)
    ]);
    const revenue = revenueRows.reduce((sum, row) => sum + row.total, 0);
    res.json({
      stats: { totalCourses: courses.length, publishedCourses: courses.filter((course) => course.published).length, totalEnrollments: enrollments, totalRevenue: revenue, currency: revenueRows[0]?._id || (process.env.STRIPE_CURRENCY || 'usd') },
      courses,
      recentEnrollments: recentEnrollments.map((row) => ({ id: row._id, student: row.user?.name || 'Learner', email: row.user?.email || '', course: row.course?.title || 'Course', progressPercent: row.progressPercent, enrolledAt: row.enrolledAt }))
    });
  } catch (error) { next(error); }
});

router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Course.find({ educator: req.user._id }).sort({ updatedAt: -1 });
    res.json({ courses });
  } catch (error) { next(error); }
});

router.get('/students', async (req, res, next) => {
  try {
    const courses = await Course.find({ educator: req.user._id }).select('_id title');
    const byId = new Map(courses.map((course) => [String(course._id), course.title]));
    const enrollments = await Enrollment.find({ course: { $in: courses.map((course) => course._id) } }).populate('user', 'name email').sort({ createdAt: -1 });
    res.json({ students: enrollments.map((item) => ({ id: item._id, name: item.user?.name || 'Learner', email: item.user?.email || '', course: byId.get(String(item.course)), progressPercent: item.progressPercent, enrolledAt: item.enrolledAt })) });
  } catch (error) { next(error); }
});

module.exports = router;
