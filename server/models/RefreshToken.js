const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const RefreshTokenSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('rft') },
    userId: { type: String, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(RefreshTokenSchema);

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
