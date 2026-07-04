const express = require('express');
const bcrypt = require('bcryptjs');

const { sendEmail } = require('../lib/email');
const { verifyGoogleIdToken } = require('../lib/googleAuth');
const { requireAuth } = require('../middleware/auth');
const {
  signAccessToken,
  generateOpaqueToken,
  hashToken,
  generateNumericCode,
  minutesFromNow,
  refreshExpiryDate,
} = require('../lib/tokens');
const {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
  googleAuthSchema,
  profileUpdateSchema,
} = require('../lib/validation');

const IS_DEV = process.env.NODE_ENV !== 'production';
const VERIFICATION_CODE_TTL_MINUTES = 15;
const RESET_CODE_TTL_MINUTES = 15;

function publicUser(user) {
  if (!user) return null;
  const { password, emailVerificationCode, passwordResetCode, ...rest } = user;
  return rest;
}

module.exports = function createAuthRouter(db) {
  const router = express.Router();

  function issueSession(user) {
    const accessToken = signAccessToken(user);
    const refreshTokenRaw = generateOpaqueToken();
    db.get('refreshTokens')
      .push({
        id: `rft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user.id,
        tokenHash: hashToken(refreshTokenRaw),
        createdAt: new Date().toISOString(),
        expiresAt: refreshExpiryDate(),
        revokedAt: null,
      })
      .write();
    return { accessToken, refreshToken: refreshTokenRaw };
  }

  function revokeRefreshToken(rawToken) {
    const hash = hashToken(rawToken);
    const entry = db.get('refreshTokens').find({ tokenHash: hash }).value();
    if (entry) db.get('refreshTokens').find({ id: entry.id }).assign({ revokedAt: new Date().toISOString() }).write();
    return entry;
  }

  function revokeAllRefreshTokensForUser(userId) {
    const now = new Date().toISOString();
    db.get('refreshTokens')
      .filter({ userId, revokedAt: null })
      .forEach((entry) => db.get('refreshTokens').find({ id: entry.id }).assign({ revokedAt: now }).write())
      .value();
  }

  // ================= REGISTER =================
  router.post('/register', validate(registerSchema), (req, res) => {
    const { name, email, password, role, homeCountry } = req.body;
    const existing = db.get('users').find({ email }).value();
    if (existing) return res.status(409).json({ message: 'An account with this email already exists' });

    const verificationCode = generateNumericCode();
    const user = {
      id: `usr-${Date.now()}`,
      name,
      email,
      password: bcrypt.hashSync(password, 8),
      role,
      authProvider: 'local',
      googleId: null,
      isEmailVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationExpiry: minutesFromNow(VERIFICATION_CODE_TTL_MINUTES),
      passwordResetCode: null,
      passwordResetExpiry: null,
      homeCountry: homeCountry || '',
      phone: '',
      language: 'en',
      avatarUrl: null,
      preferences: { interests: [], budgetTier: 'mid' },
      notificationSettings: { crowdAlerts: true, weatherAlerts: true, tripReminders: true, promotional: false },
      createdAt: new Date().toISOString(),
    };
    db.get('users').push(user).write();

    sendEmail({
      to: email,
      subject: 'Verify your TourX account',
      text: `Your TourX verification code is ${verificationCode}. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
    });

    return res.status(201).json({
      message: 'Registration successful. Check your email for a 6-digit verification code.',
      email,
      ...(IS_DEV ? { devVerificationCode: verificationCode } : {}),
    });
  });

  // ================= VERIFY EMAIL =================
  router.post('/verify-email', validate(verifyEmailSchema), (req, res) => {
    const { email, code } = req.body;
    const user = db.get('users').find({ email }).value();
    if (!user) return res.status(404).json({ message: 'No account found for this email' });
    if (user.isEmailVerified) return res.status(400).json({ message: 'This email is already verified' });
    if (user.emailVerificationCode !== code || new Date(user.emailVerificationExpiry) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    db.get('users')
      .find({ id: user.id })
      .assign({ isEmailVerified: true, emailVerificationCode: null, emailVerificationExpiry: null })
      .write();

    const verifiedUser = db.get('users').find({ id: user.id }).value();
    const session = issueSession(verifiedUser);
    return res.json({ ...session, user: publicUser(verifiedUser) });
  });

  // ================= RESEND VERIFICATION =================
  router.post('/resend-verification', validate(resendSchema), (req, res) => {
    const { email } = req.body;
    const user = db.get('users').find({ email }).value();
    const generic = { message: 'If this account exists and needs verification, a new code has been sent.' };
    if (!user || user.isEmailVerified) return res.json(generic);

    const verificationCode = generateNumericCode();
    db.get('users')
      .find({ id: user.id })
      .assign({ emailVerificationCode: verificationCode, emailVerificationExpiry: minutesFromNow(VERIFICATION_CODE_TTL_MINUTES) })
      .write();

    sendEmail({
      to: email,
      subject: 'Your new TourX verification code',
      text: `Your new TourX verification code is ${verificationCode}. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
    });

    return res.json({ ...generic, ...(IS_DEV ? { devVerificationCode: verificationCode } : {}) });
  });

  // ================= LOGIN =================
  router.post('/login', validate(loginSchema), (req, res) => {
    const { email, password } = req.body;
    const user = db.get('users').find({ email }).value();
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.password) {
      return res.status(400).json({
        message: 'This account uses Google Sign-In. Continue with Google instead.',
        code: 'GOOGLE_ACCOUNT',
      });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const session = issueSession(user);
    return res.json({ ...session, user: publicUser(user) });
  });

  // ================= REFRESH =================
  router.post('/refresh', validate(refreshSchema), (req, res) => {
    const { refreshToken } = req.body;
    const hash = hashToken(refreshToken);
    const entry = db.get('refreshTokens').find({ tokenHash: hash }).value();

    if (!entry || entry.revokedAt || new Date(entry.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token', code: 'REFRESH_INVALID' });
    }

    const user = db.get('users').find({ id: entry.userId }).value();
    if (!user) return res.status(401).json({ message: 'Invalid or expired refresh token', code: 'REFRESH_INVALID' });

    // Rotate: revoke the used refresh token and issue a brand new pair.
    db.get('refreshTokens').find({ id: entry.id }).assign({ revokedAt: new Date().toISOString() }).write();
    const session = issueSession(user);
    return res.json(session);
  });

  // ================= LOGOUT =================
  router.post('/logout', validate(logoutSchema), (req, res) => {
    revokeRefreshToken(req.body.refreshToken);
    // Always report success — logout should be idempotent even if the token was
    // already revoked or expired, so the client can always clear its local state.
    return res.json({ message: 'Logged out' });
  });

  // ================= FORGOT PASSWORD =================
  router.post('/forgot-password', validate(forgotPasswordSchema), (req, res) => {
    const { email } = req.body;
    const user = db.get('users').find({ email }).value();
    const generic = { message: 'If an account exists for this email, a reset code has been sent.' };

    if (!user || !user.password) return res.json(generic); // don't leak account existence, or nudge Google-only accounts

    const resetCode = generateNumericCode();
    db.get('users')
      .find({ id: user.id })
      .assign({ passwordResetCode: resetCode, passwordResetExpiry: minutesFromNow(RESET_CODE_TTL_MINUTES) })
      .write();

    sendEmail({
      to: email,
      subject: 'Reset your TourX password',
      text: `Your TourX password reset code is ${resetCode}. It expires in ${RESET_CODE_TTL_MINUTES} minutes. If you didn't request this, ignore this email.`,
    });

    return res.json({ ...generic, ...(IS_DEV ? { devResetCode: resetCode } : {}) });
  });

  // ================= RESET PASSWORD =================
  router.post('/reset-password', validate(resetPasswordSchema), (req, res) => {
    const { email, code, newPassword } = req.body;
    const user = db.get('users').find({ email }).value();
    if (!user || user.passwordResetCode !== code || new Date(user.passwordResetExpiry) < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    db.get('users')
      .find({ id: user.id })
      .assign({
        password: bcrypt.hashSync(newPassword, 8),
        passwordResetCode: null,
        passwordResetExpiry: null,
      })
      .write();

    // Force re-authentication everywhere after a password reset.
    revokeAllRefreshTokensForUser(user.id);

    return res.json({ message: 'Password reset successful. Please log in with your new password.' });
  });

  // ================= GOOGLE SIGN-IN =================
  router.post('/google', validate(googleAuthSchema), async (req, res) => {
    try {
      const { googleId, email, name, emailVerified } = await verifyGoogleIdToken(req.body.idToken);

      let user = db.get('users').find({ googleId }).value();
      if (!user) {
        user = db.get('users').find({ email }).value();
        if (user) {
          // Link an existing local account to this Google identity.
          db.get('users').find({ id: user.id }).assign({ googleId, isEmailVerified: user.isEmailVerified || emailVerified }).write();
          user = db.get('users').find({ id: user.id }).value();
        }
      }
      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          name,
          email,
          password: null,
          role: 'tourist',
          authProvider: 'google',
          googleId,
          isEmailVerified: true,
          emailVerificationCode: null,
          emailVerificationExpiry: null,
          passwordResetCode: null,
          passwordResetExpiry: null,
          homeCountry: '',
          phone: '',
          language: 'en',
          avatarUrl: null,
          preferences: { interests: [], budgetTier: 'mid' },
          notificationSettings: { crowdAlerts: true, weatherAlerts: true, tripReminders: true, promotional: false },
          createdAt: new Date().toISOString(),
        };
        db.get('users').push(user).write();
      }

      const session = issueSession(user);
      return res.json({ ...session, user: publicUser(user) });
    } catch (err) {
      const status = err.code === 'GOOGLE_NOT_CONFIGURED' ? 501 : 401;
      return res.status(status).json({ message: err.message, code: err.code || 'GOOGLE_AUTH_FAILED' });
    }
  });

  // ================= CURRENT USER =================
  router.get('/me', requireAuth, (req, res) => {
    const user = db.get('users').find({ id: req.user.sub }).value();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(publicUser(user));
  });

  router.patch('/me', requireAuth, validate(profileUpdateSchema), (req, res) => {
    const current = db.get('users').find({ id: req.user.sub }).value();
    if (!current) return res.status(404).json({ message: 'User not found' });

    const { preferences, notificationSettings, ...rest } = req.body;
    const changes = { ...rest };
    if (preferences) changes.preferences = { ...current.preferences, ...preferences };
    if (notificationSettings) changes.notificationSettings = { ...current.notificationSettings, ...notificationSettings };

    db.get('users').find({ id: req.user.sub }).assign(changes).write();
    const user = db.get('users').find({ id: req.user.sub }).value();
    res.json(publicUser(user));
  });

  return router;
};
