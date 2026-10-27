const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');

const router = express.Router();

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({ path: 'course', populate: { path: 'educator', select: 'name' } })
      .sort({ updatedAt: -1 });
    res.json({ enrollments: enrollments.filter((item) => item.course) });
  } catch (error) { next(error); }
});

module.exports = router;
