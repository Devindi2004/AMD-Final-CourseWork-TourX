const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const PointOfInterestSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('poi') },
    code: { type: String, required: true, unique: true }, // QR code value
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    images: { type: [String], default: [] },
    googleMapsUrl: { type: String, default: '' },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    openingHours: { type: String, default: 'Daily 6:00 AM - 6:00 PM' },
    priceRange: { type: String, enum: ['budget', 'mid', 'premium'], default: 'mid' },
    entryFeeUsd: { type: Number, default: 0 },
    recognitionTag: { type: String, default: '' }, // simulated landmark-recognition hint
    ecoTags: { type: [String], default: [] },
    crowdBaseline: { type: Number, default: 0.5 }, // 0-1, feeds Smart Crowd Prediction
    avgVisitMinutes: { type: Number, default: 60 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(PointOfInterestSchema);

module.exports = mongoose.model('PointOfInterest', PointOfInterestSchema);
