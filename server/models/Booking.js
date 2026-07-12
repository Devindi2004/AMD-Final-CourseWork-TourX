const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const BookingSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('bkg') },
    userId: { type: String, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['hotel', 'restaurant'], required: true },
    targetId: { type: String, required: true },
    targetName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, default: null },
    time: { type: String, default: null },
    partySize: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'completed'], default: 'confirmed' },
    totalEstimateUsd: { type: Number, default: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(BookingSchema);

module.exports = mongoose.model('Booking', BookingSchema);
