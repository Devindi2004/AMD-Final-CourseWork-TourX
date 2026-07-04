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

    db.get('users').find({ id: req.params.id }).assign({ role: req.body.role }).write();
    res.json(publicUser(db.get('users').find({ id: req.params.id }).value()));
  });

  return router;
};
