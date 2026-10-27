const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function safeUser(user) {
  return { id: user._id, name: user.name, email: user.email || '', role: user.role, avatarUrl: user.avatarUrl || '' };
}

function makeToken(user) {
  return jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    if (process.env.CLERK_SECRET_KEY) return res.status(400).json({ message: 'Registration is managed by Clerk in this environment.' });
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2) return res.status(400).json({ message: 'Please enter your name.' });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: 'student' });
    return res.status(201).json({ token: makeToken(user), user: safeUser(user) });
  } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    if (process.env.CLERK_SECRET_KEY) return res.status(400).json({ message: 'Sign in with Clerk in this environment.' });
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || user.active === false || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return res.json({ token: makeToken(user), user: safeUser(user) });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));

module.exports = router;
