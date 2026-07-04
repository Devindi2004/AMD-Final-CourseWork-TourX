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
  ROLES,
  SELF_REGISTERABLE_ROLES,
};
