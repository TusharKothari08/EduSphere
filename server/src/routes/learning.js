// const express = require('express');
// const mongoose = require('mongoose');
// const { requireAuth } = require('../middleware/auth');
// const { requireEducator } = require('../middleware/roles');
// const Course = require('../models/Course');
// const Enrollment = require('../models/Enrollment');
// const { Note, Review, Quiz, QuizAttempt, Assignment, Submission, Certificate } = require('../models/LearningRecord');
// const router = express.Router();
// router.get('/courses/:courseId/reviews', async (req, res, next) => { try { const reviews = await Review.find({ course: req.params.courseId, status: 'published' }).populate('user', 'name avatarUrl').sort({ createdAt: -1 }).limit(100); const summary = await Review.aggregate([{ $match: { course: new mongoose.Types.ObjectId(req.params.courseId), status: 'published' } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]); res.json({ reviews, summary: summary[0] || { average: 0, count: 0 } }); } catch (e) { next(e); } });
// router.get('/certificates/verify/:code', async (req, res, next) => { try { const certificate = await Certificate.findOne({ code: String(req.params.code).toUpperCase(), revokedAt: null }).populate('user', 'name').populate('course', 'title'); if (!certificate) return res.status(404).json({ valid: false, message: 'Certificate not found or revoked.' }); res.json({ valid: true, certificate: { code: certificate.code, student: certificate.user.name, course: certificate.course.title, issuedAt: certificate.issuedAt } }); } catch (e) { next(e); } });
// async function canLearn(userId, courseId) { const course = await Course.findById(courseId); if (!course) return { course: null, allowed: false }; const owner = String(course.educator) === String(userId); const enrollment = await Enrollment.findOne({ user: userId, course: courseId }); return { course, enrollment, allowed: owner || Boolean(enrollment) }; }
// router.use(requireAuth);
// router.get('/courses/:courseId/notes', async (req, res, next) => { try { const access = await canLearn(req.user._id, req.params.courseId); if (!access.allowed) return res.status(403).json({ message: 'Enroll in this course to access your notes.' }); const notes = await Note.find({ user: req.user._id, course: req.params.courseId }).sort({ updatedAt: -1 }); res.json({ notes }); } catch (e) { next(e); } });
// router.post('/courses/:courseId/notes', async (req, res, next) => { try { const access = await canLearn(req.user._id, req.params.courseId); if (!access.allowed) return res.status(403).json({ message: 'Enroll in this course to save notes.' }); const body = String(req.body.body || '').trim(); if (!body) return res.status(400).json({ message: 'Note text is required.' }); const note = await Note.create({ user: req.user._id, course: req.params.courseId, lessonId: String(req.body.lessonId || '').slice(0, 100), body }); res.status(201).json({ note }); } catch (e) { next(e); } });
// router.patch('/notes/:id', async (req, res, next) => { try { const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: { body: String(req.body.body || '').trim().slice(0, 10000) } }, { new: true, runValidators: true }); if (!note) return res.status(404).json({ message: 'Note not found.' }); res.json({ note }); } catch (e) { next(e); } });
// router.delete('/notes/:id', async (req, res, next) => { try { const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id }); if (!note) return res.status(404).json({ message: 'Note not found.' }); res.json({ deleted: true }); } catch (e) { next(e); } });
// router.post('/courses/:courseId/reviews', async (req, res, next) => { try { const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.courseId }); if (!enrollment) return res.status(403).json({ message: 'Only enrolled students can review this course.' }); const rating = Number(req.body.rating); const body = String(req.body.body || '').trim(); if (!Number.isInteger(rating) || rating < 1 || rating > 5 || body.length < 3) return res.status(400).json({ message: 'Choose a 1–5 star rating and write a short review.' }); const review = await Review.findOneAndUpdate({ user: req.user._id, course: req.params.courseId }, { $set: { rating, body, status: 'published' } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }); const avg = await Review.aggregate([{ $match: { course: new mongoose.Types.ObjectId(req.params.courseId), status: 'published' } }, { $group: { _id: null, average: { $avg: '$rating' } } }]); await Course.findByIdAndUpdate(req.params.courseId, { averageRating: Math.round((avg[0]?.average || rating) * 10) / 10 }); res.status(201).json({ review }); } catch (e) { next(e); } });
// router.get('/courses/:courseId/quizzes', async (req, res, next) => { try { const access = await canLearn(req.user._id, req.params.courseId); if (!access.allowed) return res.status(403).json({ message: 'Enroll in this course to access quizzes.' }); const quizzes = await Quiz.find({ course: req.params.courseId }).select('title description passingScore questions.prompt questions.options questions.points createdAt'); const attempts = await QuizAttempt.find({ user: req.user._id, quiz: { $in: quizzes.map(q => q._id) } }).sort({ submittedAt: -1 }); res.json({ quizzes, attempts }); } catch (e) { next(e); } });
// router.post('/courses/:courseId/quizzes', requireEducator, async (req, res, next) => { try { const course = await Course.findOne({ _id: req.params.courseId, educator: req.user._id }); if (!course) return res.status(404).json({ message: 'Course not found.' }); const title = String(req.body.title || '').trim(); const questions = Array.isArray(req.body.questions) ? req.body.questions.map(q => ({ prompt: String(q.prompt || '').trim(), options: Array.isArray(q.options) ? q.options.map(v => String(v).trim()).filter(Boolean).slice(0, 6) : [], correctIndex: Number(q.correctIndex), points: Math.max(1, Number(q.points) || 1) })).filter(q => q.prompt && q.options.length >= 2 && q.correctIndex >= 0 && q.correctIndex < q.options.length) : []; if (!title || !questions.length) return res.status(400).json({ message: 'A quiz needs a title and at least one valid multiple-choice question.' }); const quiz = await Quiz.create({ course: course._id, educator: req.user._id, title, description: String(req.body.description || '').slice(0, 2000), passingScore: Math.min(100, Math.max(0, Number(req.body.passingScore) || 70)), questions }); res.status(201).json({ quiz: { ...quiz.toObject(), questions: quiz.questions.map(({ prompt, options, points }) => ({ prompt, options, points })) } }); } catch (e) { next(e); } });
// router.post('/quizzes/:id/attempts', async (req, res, next) => { try { const quiz = await Quiz.findById(req.params.id); if (!quiz) return res.status(404).json({ message: 'Quiz not found.' }); const access = await canLearn(req.user._id, quiz.course); if (!access.allowed) return res.status(403).json({ message: 'Enroll in this course to submit this quiz.' }); const answers = Array.isArray(req.body.answers) ? req.body.answers.map(Number) : []; let possible = 0, earned = 0; quiz.questions.forEach((q, i) => { possible += q.points || 1; if (answers[i] === q.correctIndex) earned += q.points || 1; }); const score = possible ? Math.round(earned / possible * 100) : 0; const attempt = await QuizAttempt.create({ quiz: quiz._id, user: req.user._id, answers, score, passed: score >= quiz.passingScore }); res.status(201).json({ attempt: { _id: attempt._id, score, passed: attempt.passed, submittedAt: attempt.submittedAt }, explanations: quiz.questions.map((q, i) => ({ prompt: q.prompt, correctIndex: q.correctIndex, selectedIndex: answers[i], correct: answers[i] === q.correctIndex })) }); } catch (e) { next(e); } });
// router.post('/courses/:courseId/assignments', requireEducator, async (req, res, next) => { try { const course = await Course.findOne({ _id: req.params.courseId, educator: req.user._id }); if (!course) return res.status(404).json({ message: 'Course not found.' }); const title = String(req.body.title || '').trim(), instructions = String(req.body.instructions || '').trim(); if (!title || !instructions) return res.status(400).json({ message: 'Assignment title and instructions are required.' }); const assignment = await Assignment.create({ course: course._id, educator: req.user._id, title, instructions, dueAt: req.body.dueAt || null, maxPoints: Math.max(1, Number(req.body.maxPoints) || 100) }); res.status(201).json({ assignment }); } catch (e) { next(e); } });
// router.get('/courses/:courseId/assignments', async (req, res, next) => { try { const access = await canLearn(req.user._id, req.params.courseId); if (!access.allowed) return res.status(403).json({ message: 'Enroll in this course to access assignments.' }); const assignments = await Assignment.find({ course: req.params.courseId }).sort({ dueAt: 1, createdAt: -1 }); const submissions = await Submission.find({ course: req.params.courseId, user: req.user._id }); res.json({ assignments, submissions }); } catch (e) { next(e); } });
// router.post('/assignments/:id/submissions', async (req, res, next) => { try { const assignment = await Assignment.findById(req.params.id); if (!assignment) return res.status(404).json({ message: 'Assignment not found.' }); const access = await canLearn(req.user._id, assignment.course); if (!access.enrollment) return res.status(403).json({ message: 'Enroll in this course to submit work.' }); if (assignment.dueAt && new Date(assignment.dueAt) < new Date()) return res.status(400).json({ message: 'The deadline has passed.' }); const body = String(req.body.body || '').trim(); if (body.length < 3) return res.status(400).json({ message: 'Please add your submission before saving.' }); const submission = await Submission.findOneAndUpdate({ assignment: assignment._id, user: req.user._id }, { $set: { course: assignment.course, body, grade: null, feedback: '', gradedAt: null } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }); res.status(201).json({ submission }); } catch (e) { next(e); } });
// router.get('/educator/submissions', requireEducator, async (req, res, next) => { try { const courses = await Course.find({ educator: req.user._id }).select('_id'); const assignments = await Assignment.find({ course: { $in: courses.map(c => c._id) } }).select('_id'); const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) } }).populate('user', 'name email').populate('assignment', 'title maxPoints').populate('course', 'title').sort({ createdAt: -1 }).limit(300); res.json({ submissions }); } catch (e) { next(e); } });
// router.patch('/submissions/:id/grade', requireEducator, async (req, res, next) => { try { const submission = await Submission.findById(req.params.id).populate('assignment'); if (!submission) return res.status(404).json({ message: 'Submission not found.' }); const course = await Course.findOne({ _id: submission.course, educator: req.user._id }); if (!course) return res.status(403).json({ message: 'You cannot grade this submission.' }); const grade = Number(req.body.grade); if (!Number.isFinite(grade) || grade < 0 || grade > submission.assignment.maxPoints) return res.status(400).json({ message: 'Grade must be within the assignment point range.' }); submission.grade = grade; submission.feedback = String(req.body.feedback || '').slice(0, 3000); submission.gradedAt = new Date(); await submission.save(); res.json({ submission }); } catch (e) { next(e); } });
// router.get('/certificates/me', async (req, res, next) => { try { const certificates = await Certificate.find({ user: req.user._id, revokedAt: null }).populate('course', 'title thumbnail').sort({ issuedAt: -1 }); res.json({ certificates }); } catch (e) { next(e); } });
// router.post('/courses/:courseId/certificate', async (req, res, next) => { try { const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.courseId }); if (!enrollment || enrollment.progressPercent < 100) return res.status(403).json({ message: 'Complete every lesson in this course before requesting a certificate.' }); const crypto = require('crypto'); const certificate = await Certificate.findOneAndUpdate({ user: req.user._id, course: req.params.courseId }, { $setOnInsert: { user: req.user._id, course: req.params.courseId, code: `EDEMY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`, issuedAt: new Date() } }, { new: true, upsert: true, setDefaultsOnInsert: true }).populate('course', 'title'); res.status(201).json({ certificate }); } catch (e) { next(e); } });
// module.exports = router;


const express = require('express');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const { requireEducator } = require('../middleware/roles');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const {
  Note,
  Review,
  Quiz,
  QuizAttempt,
  Assignment,
  Submission,
  Certificate
} = require('../models/LearningRecord');

const router = express.Router();

// Public reviews for a course.
router.get('/courses/:courseId/reviews', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    const reviews = await Review.find({
      course: req.params.courseId,
      status: 'published'
    })
      .populate('user', 'name avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100);

    const summary = await Review.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(req.params.courseId),
          status: 'published'
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      reviews,
      summary: summary[0] || { average: 0, count: 0 }
    });
  } catch (error) {
    next(error);
  }
});

// Public certificate verification.
router.get('/certificates/verify/:code', async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      code: String(req.params.code).toUpperCase(),
      revokedAt: null
    })
      .populate('user', 'name')
      .populate('course', 'title');

    if (!certificate || !certificate.user || !certificate.course) {
      return res.status(404).json({
        valid: false,
        message: 'Certificate not found or revoked.'
      });
    }

    res.json({
      valid: true,
      certificate: {
        code: certificate.code,
        student: certificate.user.name,
        course: certificate.course.title,
        issuedAt: certificate.issuedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Check whether a user owns a course or is enrolled.
async function canLearn(userId, courseId) {
  if (!mongoose.isValidObjectId(courseId)) {
    return { course: null, enrollment: null, allowed: false };
  }

  const course = await Course.findById(courseId);

  if (!course) {
    return { course: null, enrollment: null, allowed: false };
  }

  const owner = String(course.educator) === String(userId);
  const enrollment = await Enrollment.findOne({
    user: userId,
    course: course._id
  });

  return {
    course,
    enrollment,
    allowed: owner || Boolean(enrollment)
  };
}

// All routes below this point require authentication.
router.use(requireAuth);

// List notes belonging to the signed-in user.
router.get('/courses/:courseId/notes', async (req, res, next) => {
  try {
    const access = await canLearn(req.user._id, req.params.courseId);

    if (!access.allowed) {
      return res.status(403).json({
        message: 'Enroll in this course to access your notes.'
      });
    }

    const notes = await Note.find({
      user: req.user._id,
      course: req.params.courseId
    }).sort({ updatedAt: -1 });

    res.json({ notes });
  } catch (error) {
    next(error);
  }
});

// Create a note.
router.post('/courses/:courseId/notes', async (req, res, next) => {
  try {
    const access = await canLearn(req.user._id, req.params.courseId);

    if (!access.allowed) {
      return res.status(403).json({
        message: 'Enroll in this course to save notes.'
      });
    }

    const body = String(req.body.body || '').trim();

    if (!body) {
      return res.status(400).json({
        message: 'Note text is required.'
      });
    }

    if (body.length > 10000) {
      return res.status(400).json({
        message: 'Notes must be 10,000 characters or fewer.'
      });
    }

    const note = await Note.create({
      user: req.user._id,
      course: req.params.courseId,
      lessonId: String(req.body.lessonId || '').slice(0, 100),
      body
    });

    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
});

// Edit only the signed-in user's note.
router.patch('/notes/:id', async (req, res, next) => {
  try {
    const body = String(req.body.body || '').trim();

    if (!body || body.length > 10000) {
      return res.status(400).json({
        message: 'Note text must be between 1 and 10,000 characters.'
      });
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { body } },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    res.json({ note });
  } catch (error) {
    next(error);
  }
});

// Delete only the signed-in user's note.
router.delete('/notes/:id', async (req, res, next) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!note) {
      return res.status(404).json({ message: 'Note not found.' });
    }

    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

// Create or update a review. Only enrolled users can review.
router.post('/courses/:courseId/reviews', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment) {
      return res.status(403).json({
        message: 'Only enrolled students can review this course.'
      });
    }

    const rating = Number(req.body.rating);
    const body = String(req.body.body || '').trim();

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      body.length < 3 ||
      body.length > 5000
    ) {
      return res.status(400).json({
        message: 'Provide a 1–5 star rating and a review of 3–5,000 characters.'
      });
    }

    const review = await Review.findOneAndUpdate(
      { user: req.user._id, course: req.params.courseId },
      { $set: { rating, body, status: 'published' } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    const average = await Review.aggregate([
      {
        $match: {
          course: new mongoose.Types.ObjectId(req.params.courseId),
          status: 'published'
        }
      },
      { $group: { _id: null, average: { $avg: '$rating' } } }
    ]);

    await Course.findByIdAndUpdate(req.params.courseId, {
      averageRating: Math.round((average[0]?.average || 0) * 10) / 10
    });

    res.status(201).json({ review });
  } catch (error) {
    next(error);
  }
});

// List quizzes without exposing the correct answers.
router.get('/courses/:courseId/quizzes', async (req, res, next) => {
  try {
    const access = await canLearn(req.user._id, req.params.courseId);

    if (!access.allowed) {
      return res.status(403).json({
        message: 'Enroll in this course to access quizzes.'
      });
    }

    const quizzes = await Quiz.find({
      course: req.params.courseId
    }).select(
      'title description passingScore questions.prompt questions.options questions.points createdAt'
    );

    const attempts = await QuizAttempt.find({
      user: req.user._id,
      quiz: { $in: quizzes.map((quiz) => quiz._id) }
    })
      .select('-answers')
      .sort({ submittedAt: -1 });

    res.json({ quizzes, attempts });
  } catch (error) {
    next(error);
  }
});

// Create a quiz for a course owned by the educator.
router.post('/courses/:courseId/quizzes', requireEducator, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    const course = await Course.findOne({
      _id: req.params.courseId,
      educator: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const title = String(req.body.title || '').trim();

    const questions = Array.isArray(req.body.questions)
      ? req.body.questions.map((question) => ({
          prompt: String(question.prompt || '').trim(),
          options: Array.isArray(question.options)
            ? question.options
                .map((option) => String(option).trim())
                .filter(Boolean)
                .slice(0, 6)
            : [],
          correctIndex: Number(question.correctIndex),
          points: Math.max(1, Number(question.points) || 1)
        })).filter((question) =>
          question.prompt &&
          question.options.length >= 2 &&
          Number.isInteger(question.correctIndex) &&
          question.correctIndex >= 0 &&
          question.correctIndex < question.options.length
        )
      : [];

    if (!title || !questions.length) {
      return res.status(400).json({
        message: 'A quiz needs a title and at least one valid multiple-choice question.'
      });
    }

    const quiz = await Quiz.create({
      course: course._id,
      educator: req.user._id,
      title,
      description: String(req.body.description || '').slice(0, 2000),
      passingScore: Math.min(
        100,
        Math.max(0, Number(req.body.passingScore) || 70)
      ),
      questions
    });

    // Never return correctIndex to the browser.
    res.status(201).json({
      quiz: {
        ...quiz.toObject(),
        questions: quiz.questions.map(({ prompt, options, points }) => ({
          prompt,
          options,
          points
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Submit a quiz attempt. Correct answers are not returned in the response.
router.post('/quizzes/:id/attempts', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid quiz ID.' });
    }

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found.' });
    }

    const access = await canLearn(req.user._id, quiz.course);

    if (!access.allowed) {
      return res.status(403).json({
        message: 'Enroll in this course to submit this quiz.'
      });
    }

    if (
      !Array.isArray(req.body.answers) ||
      req.body.answers.length !== quiz.questions.length
    ) {
      return res.status(400).json({
        message: 'Submit one answer for every question.'
      });
    }

    const answers = req.body.answers.map(Number);

    const validAnswers = answers.every((answer, index) =>
      Number.isInteger(answer) &&
      answer >= 0 &&
      answer < quiz.questions[index].options.length
    );

    if (!validAnswers) {
      return res.status(400).json({
        message: 'One or more answers are invalid.'
      });
    }

    let possible = 0;
    let earned = 0;

    quiz.questions.forEach((question, index) => {
      const points = question.points || 1;
      possible += points;

      if (answers[index] === question.correctIndex) {
        earned += points;
      }
    });

    const score = possible
      ? Math.round((earned / possible) * 100)
      : 0;

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers,
      score,
      passed: score >= quiz.passingScore
    });

    res.status(201).json({
      attempt: {
        _id: attempt._id,
        score,
        passed: attempt.passed,
        submittedAt: attempt.submittedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create an assignment for a course owned by the educator.
router.post('/courses/:courseId/assignments', requireEducator, async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.courseId,
      educator: req.user._id
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found.' });
    }

    const title = String(req.body.title || '').trim();
    const instructions = String(req.body.instructions || '').trim();

    if (!title || !instructions) {
      return res.status(400).json({
        message: 'Assignment title and instructions are required.'
      });
    }

    const assignment = await Assignment.create({
      course: course._id,
      educator: req.user._id,
      title,
      instructions,
      dueAt: req.body.dueAt || null,
      maxPoints: Math.max(1, Number(req.body.maxPoints) || 100)
    });

    res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
});

// List assignments and the current user's submissions.
router.get('/courses/:courseId/assignments', async (req, res, next) => {
  try {
    const access = await canLearn(req.user._id, req.params.courseId);

    if (!access.allowed) {
      return res.status(403).json({
        message: 'Enroll in this course to access assignments.'
      });
    }

    const assignments = await Assignment.find({
      course: req.params.courseId
    }).sort({ dueAt: 1, createdAt: -1 });

    const submissions = await Submission.find({
      course: req.params.courseId,
      user: req.user._id
    });

    res.json({ assignments, submissions });
  } catch (error) {
    next(error);
  }
});

// Submit assignment work.
router.post('/assignments/:id/submissions', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid assignment ID.' });
    }

    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const access = await canLearn(req.user._id, assignment.course);

    if (!access.enrollment) {
      return res.status(403).json({
        message: 'Enroll in this course to submit work.'
      });
    }

    if (assignment.dueAt && new Date(assignment.dueAt) < new Date()) {
      return res.status(400).json({
        message: 'The deadline has passed.'
      });
    }

    const body = String(req.body.body || '').trim();

    if (body.length < 3 || body.length > 20000) {
      return res.status(400).json({
        message: 'Submission text must be between 3 and 20,000 characters.'
      });
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignment._id, user: req.user._id },
      {
        $set: {
          course: assignment.course,
          body,
          grade: null,
          feedback: '',
          gradedAt: null
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.status(201).json({ submission });
  } catch (error) {
    next(error);
  }
});

// Educators can view submissions only for their own courses.
router.get('/educator/submissions', requireEducator, async (req, res, next) => {
  try {
    const courses = await Course.find({
      educator: req.user._id
    }).select('_id');

    const assignments = await Assignment.find({
      course: { $in: courses.map((course) => course._id) }
    }).select('_id');

    const submissions = await Submission.find({
      assignment: { $in: assignments.map((assignment) => assignment._id) }
    })
      .populate('user', 'name email')
      .populate('assignment', 'title maxPoints')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({ submissions });
  } catch (error) {
    next(error);
  }
});

// Grade a submission only for a course owned by the educator.
router.patch('/submissions/:id/grade', requireEducator, async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('assignment');

    if (!submission || !submission.assignment) {
      return res.status(404).json({
        message: 'Submission not found.'
      });
    }

    const course = await Course.findOne({
      _id: submission.course,
      educator: req.user._id
    });

    if (!course) {
      return res.status(403).json({
        message: 'You cannot grade this submission.'
      });
    }

    const grade = Number(req.body.grade);

    if (
      !Number.isFinite(grade) ||
      grade < 0 ||
      grade > submission.assignment.maxPoints
    ) {
      return res.status(400).json({
        message: 'Grade must be within the assignment point range.'
      });
    }

    submission.grade = grade;
    submission.feedback = String(req.body.feedback || '').slice(0, 3000);
    submission.gradedAt = new Date();

    await submission.save();

    res.json({ submission });
  } catch (error) {
    next(error);
  }
});

// List the signed-in user's certificates.
router.get('/certificates/me', async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      user: req.user._id,
      revokedAt: null
    })
      .populate('course', 'title thumbnail')
      .sort({ issuedAt: -1 });

    res.json({ certificates });
  } catch (error) {
    next(error);
  }
});

// Issue a certificate after completing every lesson.
router.post('/courses/:courseId/certificate', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.courseId)) {
      return res.status(400).json({ message: 'Invalid course ID.' });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId
    });

    if (!enrollment || enrollment.progressPercent < 100) {
      return res.status(403).json({
        message: 'Complete every lesson in this course before requesting a certificate.'
      });
    }

    const crypto = require('crypto');

    const certificate = await Certificate.findOneAndUpdate(
      { user: req.user._id, course: req.params.courseId },
      {
        $setOnInsert: {
          user: req.user._id,
          course: req.params.courseId,
          code: `EDEMY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
          issuedAt: new Date()
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    ).populate('course', 'title');

    res.status(201).json({ certificate });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
