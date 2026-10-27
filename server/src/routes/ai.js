// const express = require('express');
// const mongoose = require('mongoose');
// const { requireAuth } = require('../middleware/auth');
// const Course = require('../models/Course');
// const Enrollment = require('../models/Enrollment');
// const { mentorReply } = require('../services/ai');

// const router = express.Router();
// router.post('/mentor', requireAuth, async (req, res, next) => {
//   try {
//     const message = String(req.body.message || '').trim();
//     if (!message) return res.status(400).json({ message: 'Enter a question for your AI Mentor.' });
//     if (message.length > 3000) return res.status(400).json({ message: 'Please keep each message under 3,000 characters.' });
//     let courseContext = '';
//     if (req.body.courseId && mongoose.isValidObjectId(req.body.courseId)) {
//       const course = await Course.findById(req.body.courseId).select('title description sections educator published');
//       if (course) {
//         const isOwner = String(course.educator) === String(req.user._id);
//         const enrolled = await Enrollment.exists({ user: req.user._id, course: course._id });
//         if (!isOwner && !enrolled) return res.status(403).json({ message: 'Enroll in this course before asking course-specific questions.' });
//         const lessonTitles = course.sections.flatMap((section) => section.lessons.map((lesson) => lesson.title)).slice(0, 30).join(', ');
//         courseContext = `${course.title}. ${course.description.slice(0, 1000)}. Lesson titles: ${lessonTitles}`;
//       }
//     }
//     const reply = await mentorReply({ message, history: Array.isArray(req.body.history) ? req.body.history : [], courseContext });
//     res.json({ reply, mode: process.env.OPENAI_API_KEY ? 'ai' : 'demo' });
//   } catch (error) { next(error); }
// });

// module.exports = router;


const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { mentorReply } = require('../services/ai');

const router = express.Router();

router.post('/mentor', requireAuth, async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();

    if (!message) {
      return res.status(400).json({
        message: 'Enter a question for your AI Mentor.',
      });
    }

    if (message.length > 3000) {
      return res.status(400).json({
        message: 'Please keep each message under 3,000 characters.',
      });
    }

    let courseContext = '';

    if (req.body?.courseId) {
      if (!mongoose.isValidObjectId(req.body.courseId)) {
        return res.status(400).json({
          message: 'Invalid course ID.',
        });
      }

      const course = await Course.findById(req.body.courseId)
        .select('title description sections educator published');

      if (!course) {
        return res.status(404).json({
          message: 'Course not found.',
        });
      }

      const isOwner =
        String(course.educator) === String(req.user._id);

      const enrolled = await Enrollment.exists({
        user: req.user._id,
        course: course._id,
      });

      if (!isOwner && !enrolled) {
        return res.status(403).json({
          message:
            'Enroll in this course before asking course-specific questions.',
        });
      }

      const sections = Array.isArray(course.sections)
        ? course.sections
        : [];

      const lessonTitles = sections
        .flatMap((section) =>
          Array.isArray(section.lessons) ? section.lessons : []
        )
        .map((lesson) => lesson.title)
        .filter(Boolean)
        .slice(0, 30)
        .join(', ');

      courseContext = [
        `Course: ${course.title || 'Untitled course'}`,
        `Description: ${(course.description || '').slice(0, 1000)}`,
        `Lesson titles: ${lessonTitles || 'Not available'}`,
      ].join('\n');
    }

    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .filter(
            (item) =>
              item &&
              ['user', 'assistant'].includes(item.role) &&
              typeof item.content === 'string'
          )
          .slice(-10)
          .map((item) => ({
            role: item.role,
            content: item.content.slice(0, 3000),
          }))
      : [];

    const reply = await mentorReply({
      message,
      history,
      courseContext,
    });

    return res.json({
      reply,
      mode: process.env.GROQ_API_KEY ? 'ai' : 'demo',
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
