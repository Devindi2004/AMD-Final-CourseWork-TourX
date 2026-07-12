const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const EmergencyContactSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('ctc') },
    userId: { type: String, ref: 'User', required: true, index: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    relationship: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(EmergencyContactSchema);

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);
