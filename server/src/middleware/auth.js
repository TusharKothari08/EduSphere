
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : '';
}

function getClerkUserId(req) {
  // Current Clerk middleware API.
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || null;
}

function getEducatorIds() {
  return (process.env.CLERK_EDUCATOR_IDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function requireAuth(req, res, next) {
  try {
    // Clerk mode: never fall back to legacy JWT authentication.
    if (process.env.CLERK_SECRET_KEY) {
      const clerkUserId = getClerkUserId(req);

      if (!clerkUserId) {
        return res.status(401).json({
          message: 'Please sign in to continue.',
        });
      }

      const educatorIds = getEducatorIds();
      let user = await User.findOne({ clerkId: clerkUserId });

      if (!user) {
        user = await User.create({
          clerkId: clerkUserId,
          name: 'Learner',
          role: educatorIds.includes(clerkUserId)
            ? 'educator'
            : 'student',
        });
      } else if (
        educatorIds.includes(clerkUserId) &&
        user.role !== 'educator'
      ) {
        // Grant educator access only to IDs authorized on the server.
        user.role = 'educator';
        await user.save();
      }

      if (user.active === false) {
        return res.status(403).json({
          message: 'This account is suspended. Contact support.',
        });
      }

      req.user = user;
      req.authProvider = 'clerk';
      return next();
    }

    // Legacy JWT mode is used only when Clerk is not configured.
    const token = getBearerToken(req);

    if (!token || !process.env.JWT_SECRET) {
      return res.status(401).json({
        message: 'Please sign in to continue.',
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        message:
          'Your session is invalid or expired. Please sign in again.',
      });
    }

    if (!payload?.userId) {
      return res.status(401).json({
        message: 'Please sign in to continue.',
      });
    }

    const user = await User.findById(payload.userId);

    if (!user || user.active === false) {
      return res.status(401).json({
        message: 'Please sign in to continue.',
      });
    }

    req.user = user;
    req.authProvider = 'local';
    return next();
  } catch (error) {
    return next(error);
  }
}

function optionalAuth(req, res, next) {
  let hasClerkIdentity = false;

  try {
    hasClerkIdentity = Boolean(getClerkUserId(req));
  } catch {
    hasClerkIdentity = false;
  }

  const hasBearerToken = Boolean(getBearerToken(req));

  if (!hasBearerToken && !hasClerkIdentity) {
    return next();
  }

  return requireAuth(req, res, next);
}

module.exports = { requireAuth, optionalAuth };
