const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const SavedItemSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('svd') },
    userId: { type: String, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['poi', 'hotel', 'restaurant'], required: true },
    targetId: { type: String, required: true },
    listType: { type: String, enum: ['wishlist', 'favorite', 'saved_place'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(SavedItemSchema);

module.exports = mongoose.model('SavedItem', SavedItemSchema);
