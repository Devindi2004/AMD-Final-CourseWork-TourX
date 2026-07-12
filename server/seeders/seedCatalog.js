const { Hotel, Restaurant, PointOfInterest } = require('../models');
const hotels = require('./data/hotels');
const restaurants = require('./data/restaurants');
const attractions = require('./data/attractions');

/**
 * Populates Hotels, Restaurants, and Tourist Attractions (PointOfInterest).
 * By default it's a no-op once the catalog has been seeded, so it's safe to call
 * on every server startup; pass { force: true } (used by the standalone `npm run
 * seed` script) to wipe and reseed those three collections unconditionally.
 */
async function seedCatalog({ force = false } = {}) {
  const [hotelCount, restaurantCount, poiCount] = await Promise.all([
    Hotel.countDocuments(),
    Restaurant.countDocuments(),
    PointOfInterest.countDocuments(),
  ]);
  const alreadySeeded = hotelCount > 0 && restaurantCount > 0 && poiCount > 0;

  if (alreadySeeded && !force) {
    console.log('Catalog already seeded (hotels/restaurants/attractions) — skipping.');
    return { skipped: true };
  }

  await Promise.all([Hotel.deleteMany({}), Restaurant.deleteMany({}), PointOfInterest.deleteMany({})]);
  await Hotel.insertMany(hotels);
  await Restaurant.insertMany(restaurants);
  await PointOfInterest.insertMany(attractions);

  console.log(
    `Seeded catalog: ${hotels.length} hotels, ${restaurants.length} restaurants, ${attractions.length} tourist attractions.`
  );
  return { skipped: false, hotels: hotels.length, restaurants: restaurants.length, attractions: attractions.length };
}

module.exports = { seedCatalog };
