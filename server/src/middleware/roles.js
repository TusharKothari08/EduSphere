function requireEducator(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' });
  if (!['educator', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'This action is available to educators only.' });
  return next();
}
function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  return next();
}
module.exports = { requireEducator, requireAdmin };
