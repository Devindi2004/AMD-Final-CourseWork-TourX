const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tourx';

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI);
  console.log(`MongoDB connected -> ${mongoose.connection.name}@${mongoose.connection.host}`);
}

module.exports = { connectDB, MONGODB_URI };
