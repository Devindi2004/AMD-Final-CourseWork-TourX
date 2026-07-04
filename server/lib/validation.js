const { z } = require('zod');

const ROLES = ['tourist', 'guide', 'hotel_owner', 'restaurant_owner', 'admin'];
const SELF_REGISTERABLE_ROLES = ['tourist', 'guide', 'hotel_owner', 'restaurant_owner'];

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  password: passwordSchema,
  role: z.enum(SELF_REGISTERABLE_ROLES).optional().default('tourist'),
  homeCountry: z.string().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Enter the 6-digit code'),
});

const resendSchema = z.object({ email: z.string().email() });

const forgotPasswordSchema = z.object({ email: z.string().email() });

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Enter the 6-digit code'),
  newPassword: passwordSchema,
});

const refreshSchema = z.object({ refreshToken: z.string().min(10) });

const logoutSchema = z.object({ refreshToken: z.string().min(10) });

const googleAuthSchema = z.object({ idToken: z.string().min(10) });

const changeRoleSchema = z.object({ role: z.enum(ROLES) });

const profileUpdateSchema = z
  .object({
    name: z.string().min(2).optional(),
    homeCountry: z.string().optional(),
    phone: z
      .string()
      .regex(/^[+0-9 ()-]{6,20}$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    language: z.string().optional(),
    avatarUrl: z.string().url().optional().nullable(),
    preferences: z
      .object({
        interests: z.array(z.string()).optional(),
        budgetTier: z.enum(['budget', 'mid', 'premium']).optional(),
      })
      .partial()
      .optional(),
    notificationSettings: z
      .object({
        crowdAlerts: z.boolean().optional(),
        weatherAlerts: z.boolean().optional(),
        tripReminders: z.boolean().optional(),
        promotional: z.boolean().optional(),
      })
      .partial()
      .optional(),
  })
  .partial();

const LIST_TYPES = ['wishlist', 'favorite', 'saved_place'];
const SAVEABLE_TARGET_TYPES = ['poi', 'hotel', 'restaurant'];

const savedItemSchema = z.object({
  targetType: z.enum(SAVEABLE_TARGET_TYPES),
  targetId: z.string().min(1),
  listType: z.enum(LIST_TYPES),
});

const BOOKING_TARGET_TYPES = ['hotel', 'restaurant'];
const BOOKING_STATUSES = ['confirmed', 'cancelled', 'completed'];

const bookingCreateSchema = z.object({
  targetType: z.enum(BOOKING_TARGET_TYPES),
  targetId: z.string().min(1),
  targetName: z.string().min(1),
  startDate: z.string().min(8, 'Enter a valid date (YYYY-MM-DD)'),
  endDate: z.string().min(8).optional().nullable(),
  time: z.string().optional().nullable(),
  partySize: z.number().int().min(1).max(30),
  notes: z.string().optional().default(''),
});

const bookingStatusSchema = z.object({ status: z.enum(BOOKING_STATUSES) });

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
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
  changeRoleSchema,
  profileUpdateSchema,
  savedItemSchema,
  bookingCreateSchema,
  bookingStatusSchema,
  ROLES,
  SELF_REGISTERABLE_ROLES,
  LIST_TYPES,
  SAVEABLE_TARGET_TYPES,
  BOOKING_TARGET_TYPES,
  BOOKING_STATUSES,
};
