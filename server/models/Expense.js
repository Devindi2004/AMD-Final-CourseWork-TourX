const mongoose = require('mongoose');
const { Schema } = mongoose;
const { makeIdFactory } = require('../lib/idGenerator');
const { idTransform } = require('./plugins/idTransform');

const ExpenseSchema = new Schema(
  {
    _id: { type: String, default: makeIdFactory('exp') },
    tripId: { type: String, ref: 'Trip', required: true, index: true },
    userId: { type: String, ref: 'User', required: true, index: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    note: { type: String, default: '' },
    date: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

idTransform(ExpenseSchema);

module.exports = mongoose.model('Expense', ExpenseSchema);
