const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const ReviewSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('rev') },
    userId: { type: String, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['poi', 'hotel', 'restaurant'], required: true, index: true },
    targetId: { type: String, required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    photos: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(ReviewSchema);

module.exports = mongoose.model('Review', ReviewSchema);
