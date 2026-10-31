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
    roleAssigned: Boolean(user.roleAssigned),
    avatarUrl: user.avatarUrl || '',
  };
}

// Get the authenticated user's profile.
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: getPublicUser(req.user) });
});

// Update profile and assign the initial role on registration only once.
router.patch('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const user = req.user;

    if (req.body.name !== undefined) {
      user.name = String(req.body.name).trim().slice(0, 100) || user.name;
    }

    if (req.body.avatarUrl !== undefined) {
      user.avatarUrl = String(req.body.avatarUrl).trim().slice(0, 1000);
    }

    if (req.body.email !== undefined && !user.email) {
      const email = String(req.body.email).trim().toLowerCase();
      if (/^\S+@\S+\.\S+$/.test(email)) {
        user.email = email;
      }
    }

    // Server-authorized educator IDs always have educator privileges.
    const educatorIds = (process.env.CLERK_EDUCATOR_IDS || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (user.clerkId && educatorIds.includes(user.clerkId)) {
      user.role = 'educator';
      user.roleAssigned = true;
    } else if (user.roleAssigned === false && user.role !== 'admin') {
      // First-time public registration request: allow only student or educator.
      // Admin is NEVER selectable via public registration.
      const requestedRole = req.body.requestedRole;
      if (requestedRole === 'educator') {
        user.role = 'educator';
      } else {
        user.role = 'student';
      }
      user.roleAssigned = true;
    }
    // Note: If user.roleAssigned is already true, role modification is forbidden,
    // protecting existing accounts and preventing students from self-promoting.

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
