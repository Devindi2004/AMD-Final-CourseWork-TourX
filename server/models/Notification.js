const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const NotificationSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('ntf') },
    userId: { type: String, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(NotificationSchema);

module.exports = mongoose.model('Notification', NotificationSchema);
