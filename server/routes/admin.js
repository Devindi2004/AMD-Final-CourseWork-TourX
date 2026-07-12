const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate, changeRoleSchema } = require('../lib/validation');

function publicUser(user) {
  if (!user) return null;
  const { password, emailVerificationCode, passwordResetCode, ...rest } = user;
  return rest;
}

module.exports = function createAdminRouter(db) {
  const router = express.Router();

  router.use(requireAuth, requireRole('admin'));

  router.get('/users', (req, res) => {
    const users = db.get('users').value().map(publicUser);
    res.json(users);
  });

  router.patch('/users/:id/role', validate(changeRoleSchema), (req, res) => {
    const user = db.get('users').find({ id: req.params.id }).value();
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (req.params.id === req.user.sub) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    db.get('users').find({ id: req.params.id }).assign({ role: req.body.role }).write();
    res.json(publicUser(db.get('users').find({ id: req.params.id }).value()));
  });

  router.get('/gallery/pending', (req, res) => {
    const pending = db.get('gallery').filter({ status: 'pending' }).value();
    res.json(pending);
  });

  router.post('/gallery/:id/approve', (req, res) => {
    const item = db.get('gallery').find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    db.get('gallery').find({ id: req.params.id }).assign({ status: 'approved', updatedAt: new Date().toISOString() }).write();
    res.json(db.get('gallery').find({ id: req.params.id }).value());
  });

  router.post('/gallery/:id/reject', (req, res) => {
    const item = db.get('gallery').find({ id: req.params.id }).value();
    if (!item) return res.status(404).json({ message: 'Gallery item not found' });
    db.get('gallery').find({ id: req.params.id }).assign({ status: 'rejected', updatedAt: new Date().toISOString() }).write();
    res.json(db.get('gallery').find({ id: req.params.id }).value());
  });

  router.get('/gallery/analytics', (req, res) => {
    const items = db.get('gallery').value();
    const approved = items.filter((g) => g.status === 'approved');

    const countBy = (key) => {
      const counts = {};
      approved.forEach((g) => { counts[g[key]] = (counts[g[key]] || 0) + 1; });
      return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));
    };

    res.json({
      totalImages: approved.length,
      pendingUploads: items.filter((g) => g.status === 'pending').length,
      totalViews: approved.reduce((sum, g) => sum + (g.views || 0), 0),
      totalLikes: approved.reduce((sum, g) => sum + (g.likedBy?.length || 0), 0),
      totalDownloads: approved.reduce((sum, g) => sum + (g.downloads || 0), 0),
      topCategories: countBy('category'),
      trendingDestinations: [...approved].sort((a, b) => b.views - a.views).slice(0, 5).map((g) => ({ id: g.id, title: g.title, views: g.views })),
    });
  });

  return router;
};
