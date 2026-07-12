require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { seedCatalog } = require('./seedCatalog');

// Standalone entry point: `npm run seed` (see server/package.json). Always force-reseeds
// the catalog collections, regardless of whether they already have data.
(async () => {
  try {
    await connectDB();
    await seedCatalog({ force: true });
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
