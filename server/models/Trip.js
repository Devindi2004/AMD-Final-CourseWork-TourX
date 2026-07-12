const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const ItineraryItemSchema = new Schema(
  {
    day: Number,
    time: String,
    poiId: String,
    name: String,
    activity: String,
    estimatedCostUsd: Number,
  },
  { _id: false }
);

const TripSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('trip') },
    userId: { type: String, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    budgetUsd: { type: Number, default: 0 },
    ecoScore: { type: Number, default: null },
    transportModes: { type: [String], default: [] },
    itineraryItems: { type: [ItineraryItemSchema], default: [] },
    status: { type: String, enum: ['planned', 'ongoing', 'completed'], default: 'planned' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(TripSchema);

module.exports = mongoose.model('Trip', TripSchema);
