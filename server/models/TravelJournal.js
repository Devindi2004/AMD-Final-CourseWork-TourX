const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const GeoPointSchema = new Schema({ lat: Number, lng: Number }, { _id: false });

const TravelJournalSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('jrn') },
    tripId: { type: String, ref: 'Trip', required: true, index: true },
    userId: { type: String, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    entryText: { type: String, default: '' },
    photos: { type: [String], default: [] },
    location: { type: GeoPointSchema, default: null },
    timestamp: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(TravelJournalSchema);

module.exports = mongoose.model('TravelJournal', TravelJournalSchema);
