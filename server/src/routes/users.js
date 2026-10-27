
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

function getPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || '',
    role: user.role,
    avatarUrl: user.avatarUrl || '',
  };
}

// Get the authenticated user's profile.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: getPublicUser(req.user) });
});

// Update editable profile fields and sync an authorized educator role.
router.patch('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;

    if (req.body.name !== undefined) {
      user.name =
        String(req.body.name).trim().slice(0, 100) || user.name;
    }

    if (req.body.avatarUrl !== undefined) {
      user.avatarUrl = String(req.body.avatarUrl)
        .trim()
        .slice(0, 1000);
    }

    // Never accept role changes from the browser.
    // Configure authorized Clerk IDs in server/.env.
    const educatorIds = (process.env.CLERK_EDUCATOR_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (user.clerkId && educatorIds.includes(user.clerkId)) {
      user.role = 'educator';
    }

    await user.save();

    res.json({ user: getPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

// List educators.
router.get('/educators', async (req, res, next) => {
  try {
    const educators = await User.find({ role: 'educator' })
      .select('name avatarUrl')
      .limit(100);

    res.json({ educators });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
