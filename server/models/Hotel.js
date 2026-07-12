const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const LocationSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const HotelSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('htl') },
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    location: { type: LocationSchema, required: true },
    // "category" captures the request's Luxury/Budget/Resort/Villa/Beach Hotel groupings,
    // separate from priceRange (which drives the existing budget filter chips in the app).
    category: {
      type: String,
      enum: ['luxury', 'budget', 'resort', 'villa', 'beach'],
      required: true,
      index: true,
    },
    priceRange: { type: String, enum: ['budget', 'mid', 'premium'], required: true },
    pricePerNightUsd: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    googleMapsUrl: { type: String, default: '' },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    openingHours: { type: String, default: '24 hours (check-in from 2:00 PM)' },
    description: { type: String, default: '' },
    ownerId: { type: String, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(HotelSchema);

module.exports = mongoose.model('Hotel', HotelSchema);
