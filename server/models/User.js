const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const PreferencesSchema = new Schema(
  {
    interests: { type: [String], default: [] },
    budgetTier: { type: String, enum: ['budget', 'mid', 'premium'], default: 'mid' },
  },
  { _id: false }
);

const NotificationSettingsSchema = new Schema(
  {
    crowdAlerts: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    tripReminders: { type: Boolean, default: true },
    promotional: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('usr') },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: null }, // null for Google-only accounts
    role: {
      type: String,
      enum: ['tourist', 'guide', 'hotel_owner', 'restaurant_owner', 'admin'],
      default: 'tourist',
    },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String, default: null },
    emailVerificationExpiry: { type: Date, default: null },
    passwordResetCode: { type: String, default: null },
    passwordResetExpiry: { type: Date, default: null },
    homeCountry: { type: String, default: '' },
    phone: { type: String, default: '' },
    language: { type: String, default: 'en' },
    avatarUrl: { type: String, default: null },
    preferences: { type: PreferencesSchema, default: () => ({}) },
    notificationSettings: { type: NotificationSettingsSchema, default: () => ({}) },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(UserSchema);

module.exports = mongoose.model('User', UserSchema);
