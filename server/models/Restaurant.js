const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const LocationSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const RestaurantSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('res') },
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    location: { type: LocationSchema, required: true },
    cuisine: { type: [String], required: true, index: true }, // e.g. Sri Lankan, Chinese, Japanese, Italian, Indian
    priceRange: { type: String, enum: ['budget', 'mid', 'premium'], required: true },
    tags: { type: [String], default: [] },
    images: { type: [String], default: [] },
    googleMapsUrl: { type: String, default: '' },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    openingHours: { type: String, default: '11:00 AM - 10:00 PM' },
    description: { type: String, default: '' },
    ownerId: { type: String, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(RestaurantSchema);

module.exports = mongoose.model('Restaurant', RestaurantSchema);
