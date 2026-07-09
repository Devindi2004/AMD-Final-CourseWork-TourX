require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');

const { requireAuth, requireRole } = require('./middleware/auth');
const createAuthRouter = require('./routes/auth');
const createAdminRouter = require('./routes/admin');
const createUploadsRouter = require('./routes/uploads');
const { validate, savedItemSchema, bookingCreateSchema, bookingStatusSchema } = require('./lib/validation');
const { translateText } = require('./lib/translate');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

const dbPath = path.join(__dirname, 'db.json');
const router = jsonServer.router(dbPath);
const db = router.db; // lowdb instance backing db.json

// ---------- static AI/reference datasets ----------
const pois = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/pois.json'), 'utf8'));
const transportRoutes = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/transportRoutes.json'), 'utf8'));
const chatbotResponses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/chatbotResponses.json'), 'utf8'));

// ---------- seed demo accounts (one per role) on first run ----------
function seedDemoData() {
  if (db.get('users').size().value() > 0) return;

  const now = new Date().toISOString();
  const makeUser = (overrides) => ({
    authProvider: 'local',
    googleId: null,
    isEmailVerified: true,
    emailVerificationCode: null,
    emailVerificationExpiry: null,
    passwordResetCode: null,
    passwordResetExpiry: null,
    homeCountry: 'Sri Lanka',
    phone: '',
    language: 'en',
    avatarUrl: null,
    preferences: { interests: ['Historical Landmark', 'Wildlife', 'Beach'], budgetTier: 'mid' },
    notificationSettings: { crowdAlerts: true, weatherAlerts: true, tripReminders: true, promotional: false },
    createdAt: now,
    ...overrides,
  });

  const demoUser = makeUser({
    id: 'usr-demo-001',
    name: 'Devindi Perera',
    email: 'demo@tourx.app',
    password: bcrypt.hashSync('Passw0rd!', 8),
    role: 'tourist',
    phone: '+94 77 123 4567',
  });
  const demoAdmin = makeUser({
    id: 'usr-demo-admin',
    name: 'TourX Admin',
    email: 'admin@tourx.app',
    password: bcrypt.hashSync('AdminPass1', 8),
    role: 'admin',
  });
  const demoGuide = makeUser({
    id: 'usr-demo-guide',
    name: 'Kasun Silva',
    email: 'guide@tourx.app',
    password: bcrypt.hashSync('GuidePass1', 8),
    role: 'guide',
  });
  const demoHotelOwner = makeUser({
    id: 'usr-demo-hotel',
    name: 'Amara Fernando',
    email: 'hotelowner@tourx.app',
    password: bcrypt.hashSync('HotelPass1', 8),
    role: 'hotel_owner',
  });
  const demoRestaurantOwner = makeUser({
    id: 'usr-demo-restaurant',
    name: 'Ruwan Jayasuriya',
    email: 'restaurantowner@tourx.app',
    password: bcrypt.hashSync('RestoPass1', 8),
    role: 'restaurant_owner',
  });

  db.get('users').push(demoUser, demoAdmin, demoGuide, demoHotelOwner, demoRestaurantOwner).write();

  const demoTrip = {
    id: 'trip-demo-001',
    userId: demoUser.id,
    title: 'Cultural Triangle Explorer',
    destination: 'Sigiriya',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
    budgetUsd: 400,
    ecoScore: null,
    transportModes: ['train', 'walking'],
    itineraryItems: [
      { day: 1, time: '09:00', poiId: 'poi-001', name: 'Sigiriya Rock Fortress', activity: 'Climb the rock fortress', estimatedCostUsd: 30 },
      { day: 2, time: '09:00', poiId: 'poi-005', name: 'Dambulla Cave Temple', activity: 'Explore the cave temples', estimatedCostUsd: 12 },
      { day: 3, time: '09:00', poiId: 'poi-006', name: 'Pinnawala Elephant Orphanage', activity: 'Watch the elephant river bathing', estimatedCostUsd: 15 },
    ],
    status: 'planned',
    createdAt: now,
  };
  db.get('trips').push(demoTrip).write();

  db.get('expenses')
    .push(
      { id: 'exp-demo-001', tripId: demoTrip.id, userId: demoUser.id, category: 'Accommodation', amount: 120, currency: 'USD', note: 'Sigiriya Jungle Lodge, 2 nights', date: now.slice(0, 10) },
      { id: 'exp-demo-002', tripId: demoTrip.id, userId: demoUser.id, category: 'Food', amount: 35, currency: 'USD', note: 'Rock View Grill dinner', date: now.slice(0, 10) }
    )
    .write();

  db.get('travelJournals')
    .push({
      id: 'jrn-demo-001',
      tripId: demoTrip.id,
      userId: demoUser.id,
      title: 'First glimpse of Sigiriya',
      entryText: 'The rock fortress appeared through the morning mist right on schedule. Worth every one of the 1,200 steps.',
      photos: [],
      location: { lat: 7.9570, lng: 80.7603 },
      timestamp: now,
    })
    .write();

  db.get('emergencyContacts')
    .push({ id: 'ctc-demo-001', userId: demoUser.id, contactName: 'Nimal Perera', contactPhone: '+94 71 234 5678', relationship: 'Brother' })
    .write();

  db.get('reviews')
    .push(
      { id: 'rev-demo-001', userId: demoUser.id, targetType: 'poi', targetId: 'poi-004', rating: 5, comment: 'Watching the train cross Nine Arches Bridge at sunrise was unforgettable.', photos: [], createdAt: now },
      { id: 'rev-demo-002', userId: demoUser.id, targetType: 'hotel', targetId: 'htl-004', rating: 5, comment: 'Galle Fort Boutique Villa has the best rooftop view in the fort.', photos: [], createdAt: now }
    )
    .write();

  db.get('notifications')
    .push(
      { id: 'ntf-demo-001', userId: demoUser.id, type: 'crowd', message: 'Sigiriya Rock Fortress crowd levels are lowest before 8am.', isRead: false, createdAt: now },
      { id: 'ntf-demo-002', userId: demoUser.id, type: 'weather', message: 'Rain expected in Kandy this afternoon — pack a light rain jacket.', isRead: false, createdAt: now }
    )
    .write();

  db.get('savedItems')
    .push(
      { id: 'svd-demo-001', userId: demoUser.id, targetType: 'poi', targetId: 'poi-009', listType: 'wishlist', createdAt: now },
      { id: 'svd-demo-002', userId: demoUser.id, targetType: 'hotel', targetId: 'htl-004', listType: 'favorite', createdAt: now },
      { id: 'svd-demo-003', userId: demoUser.id, targetType: 'poi', targetId: 'poi-002', listType: 'saved_place', createdAt: now }
    )
    .write();

  db.get('bookings')
    .push({
      id: 'bkg-demo-001',
      userId: demoUser.id,
      targetType: 'hotel',
      targetId: 'htl-002',
      targetName: 'Sigiriya Jungle Lodge',
      startDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10),
      time: null,
      partySize: 2,
      status: 'confirmed',
      totalEstimateUsd: 240,
      notes: 'Anniversary trip — requested a rock-view room.',
      createdAt: now,
    })
    .write();

  console.log('Seeded demo accounts (all password-verified, ready to log in):');
  console.log('  tourist            demo@tourx.app            / Passw0rd!');
  console.log('  admin              admin@tourx.app           / AdminPass1');
  console.log('  guide              guide@tourx.app           / GuidePass1');
  console.log('  hotel_owner        hotelowner@tourx.app      / HotelPass1');
  console.log('  restaurant_owner   restaurantowner@tourx.app / RestoPass1');
}
seedDemoData();

['refreshTokens', 'savedItems', 'bookings'].forEach((collection) => {
  if (!db.has(collection).value()) db.set(collection, []).write();
});

// ================= AUTH, ADMIN & UPLOADS =================
app.use('/auth', createAuthRouter(db));
app.use('/admin', createAdminRouter(db));
app.use('/uploads', createUploadsRouter());

// ================= POINTS OF INTEREST =================
app.get('/pois', (req, res) => {
  const { city, category, q } = req.query;
  let result = pois;
  if (city) result = result.filter((p) => p.city.toLowerCase() === String(city).toLowerCase());
  if (category) result = result.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (q) result = result.filter((p) => p.name.toLowerCase().includes(String(q).toLowerCase()));
  res.json(result);
});

app.get('/pois/code/:code', (req, res) => {
  const poi = pois.find((p) => p.code.toLowerCase() === req.params.code.toLowerCase());
  if (!poi) return res.status(404).json({ message: 'No point of interest matches this QR code' });
  res.json(poi);
});

// ================= AI LANDMARK RECOGNITION (simulated computer-vision API) =================
app.post('/ai/landmark-recognition', (req, res) => {
  const { imageBase64, hint } = req.body || {};
  if (!imageBase64 && !hint) {
    return res.status(400).json({ message: 'imageBase64 or hint is required' });
  }
  let poi;
  if (hint) {
    const h = String(hint).toLowerCase();
    poi = pois.find((p) => p.city.toLowerCase().includes(h) || p.name.toLowerCase().includes(h));
  }
  if (!poi && imageBase64) {
    // Deterministic pseudo-recognition: the same photo always resolves to the same
    // landmark, simulating a trained model without needing a real cloud vision call.
    let hash = 0;
    for (let i = 0; i < imageBase64.length; i += 97) {
      hash = (hash * 31 + imageBase64.charCodeAt(i)) % 100000;
    }
    poi = pois[hash % pois.length];
  }
  if (!poi) poi = pois[Math.floor(Math.random() * pois.length)];

  setTimeout(() => {
    res.json({
      matchConfidence: Number((0.82 + Math.random() * 0.15).toFixed(2)),
      landmark: poi,
      simulated: true,
      note: 'Simulates the cloud computer-vision API from the proposal using deterministic offline matching.',
    });
  }, 600);
});

// ================= AI TRAVEL PLANNER (simulated LLM itinerary generation) =================
app.post('/ai/itinerary', (req, res) => {
  const { destination, days, budgetTier, interests } = req.body || {};
  const numDays = Math.min(Math.max(parseInt(days, 10) || 3, 1), 14);
  const tier = budgetTier || 'mid';
  const interestList = Array.isArray(interests) ? interests : [];

  const d = destination ? String(destination).toLowerCase() : '';
  const cityMatches = d ? pois.filter((p) => p.city.toLowerCase().includes(d)) : [];
  const interestMatches = interestList.length
    ? pois.filter((p) =>
        interestList.some(
          (i) => p.category.toLowerCase().includes(String(i).toLowerCase()) || p.ecoTags.includes(i)
        )
      )
    : [];

  // Prioritise POIs matching both filters, then one filter, then top up with the rest
  // of the dataset so short trips near a single small town still get day-to-day variety.
  const byId = new Map();
  const addAll = (list) => list.forEach((p) => { if (!byId.has(p.id)) byId.set(p.id, p); });
  addAll(cityMatches.filter((p) => interestMatches.some((m) => m.id === p.id)));
  addAll(cityMatches);
  addAll(interestMatches);
  addAll(pois);
  const candidates = Array.from(byId.values());

  const itinerary = [];
  let cursor = 0;
  for (let day = 1; day <= numDays; day++) {
    const dayPois = [0, 1].map(() => {
      const poi = candidates[cursor % candidates.length];
      cursor += 1;
      return poi;
    });
    itinerary.push({
      day,
      title: `Day ${day}: ${dayPois[0].city}`,
      items: dayPois.map((p, i) => ({
        time: i === 0 ? '09:00' : '14:30',
        poiId: p.id,
        name: p.name,
        activity: `Visit ${p.name} (${p.category})`,
        estimatedCostUsd:
          tier === 'budget'
            ? Math.round(p.entryFeeUsd * 0.7)
            : tier === 'premium'
            ? Math.round(p.entryFeeUsd * 1.4 + 20)
            : p.entryFeeUsd,
      })),
    });
  }

  const totalEstimate = itinerary.reduce(
    (sum, d) => sum + d.items.reduce((s, i) => s + i.estimatedCostUsd, 0),
    0
  );

  setTimeout(() => {
    res.json({
      destination: destination || 'Sri Lanka',
      days: numDays,
      budgetTier: tier,
      interests: interestList,
      estimatedTotalUsd: totalEstimate,
      itinerary,
      simulated: true,
      note: 'Simulates the large-language-model itinerary planner from the proposal using rule-based generation over the POI dataset.',
    });
  }, 900);
});

// ================= AI CHATBOT =================
app.post('/ai/chatbot', (req, res) => {
  const { message } = req.body || {};
  const text = String(message || '').toLowerCase();
  const match = chatbotResponses.find((r) => r.keywords.some((k) => text.includes(k)));
  const reply = match
    ? match.reply
    : "I'm not sure about that yet, but you can ask me about itineraries, offline maps, safety, weather, food, hotels, crowds, or transport.";
  setTimeout(() => res.json({ reply, simulated: true }), 400);
});

// ================= AI TRANSLATOR (real, Claude Haiku 4.5, auto-detects source language) =================
app.post('/ai/translate', async (req, res) => {
  const { text, targetLanguage } = req.body || {};
  if (!text || !String(text).trim()) return res.status(400).json({ message: 'text is required' });
  if (!targetLanguage || !String(targetLanguage).trim()) {
    return res.status(400).json({ message: 'targetLanguage is required, e.g. "French"' });
  }

  try {
    const result = await translateText(String(text), String(targetLanguage));
    res.json({
      original: text,
      targetLanguage,
      translated: result.translated,
      detectedSourceLang: result.detectedSourceLang,
      detectedSourceLangName: result.detectedSourceLangName,
    });
  } catch (err) {
    const status = err.code === 'ANTHROPIC_NOT_CONFIGURED' ? 501 : 502;
    res.status(status).json({ message: err.message, code: err.code || 'TRANSLATION_FAILED' });
  }
});

// ================= SMART CROWD PREDICTION =================
app.get('/crowd/:poiId', (req, res) => {
  const poi = pois.find((p) => p.id === req.params.poiId);
  if (!poi) return res.status(404).json({ message: 'Unknown point of interest' });
  const hour = new Date().getHours();
  const timeFactor = hour >= 10 && hour <= 16 ? 1.2 : 0.7;
  const score = Math.min(0.97, poi.crowdBaseline * timeFactor);
  const level = score > 0.66 ? 'High' : score > 0.4 ? 'Medium' : 'Low';
  res.json({ poiId: poi.id, name: poi.name, crowdScore: Number(score.toFixed(2)), level, checkedAt: new Date().toISOString() });
});

// ================= PUBLIC TRANSPORT ASSISTANT =================
app.get('/transport/routes', (req, res) => {
  const { from, to } = req.query;
  let result = transportRoutes;
  if (from) result = result.filter((r) => r.from.toLowerCase().includes(String(from).toLowerCase()));
  if (to) result = result.filter((r) => r.to.toLowerCase().includes(String(to).toLowerCase()));
  res.json(result);
});

// ================= WEATHER (real, keyless proxy to Open-Meteo) =================
app.get('/weather', async (req, res) => {
  const lat = req.query.lat || '7.2906';
  const lon = req.query.lon || '80.6337';
  const city = req.query.city || 'Kandy';
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Upstream weather API returned ${resp.status}`);
    const data = await resp.json();
    res.json({ city, source: 'open-meteo', ...data });
  } catch (err) {
    res.status(502).json({ message: 'Weather provider unreachable', error: String(err.message || err) });
  }
});

// ================= PROTECTED CRUD RESOURCES (json-server) =================
// GET requests are public (browsing hotels/restaurants/reviews). Writes require a
// bearer access token; hotels/restaurants additionally require the matching owner
// role (or admin), demonstrating role-gated protected routes end to end.
app.use('/api/hotels', (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireAuth(req, res, () => requireRole('hotel_owner', 'admin')(req, res, next));
});
app.use('/api/restaurants', (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireAuth(req, res, () => requireRole('restaurant_owner', 'admin')(req, res, next));
});
// Wishlist/Favorites/Saved Places are one model (savedItems) distinguished by listType.
// userId/createdAt are set server-side from the authenticated token, never trusted from the client.
app.use('/api/savedItems', (req, res, next) => {
  if (req.method !== 'POST') return next();
  return requireAuth(req, res, () =>
    validate(savedItemSchema)(req, res, () => {
      req.body.userId = req.user.sub;
      req.body.createdAt = new Date().toISOString();
      next();
    })
  );
});
// PATCH only ever changes a booking's status (cancel/complete) here — other fields
// are intentionally stripped by the schema rather than freely editable post-creation.
app.use('/api/bookings', (req, res, next) => {
  if (req.method === 'POST') {
    return requireAuth(req, res, () =>
      validate(bookingCreateSchema)(req, res, () => {
        req.body.userId = req.user.sub;
        req.body.status = 'confirmed';
        req.body.createdAt = new Date().toISOString();
        next();
      })
    );
  }
  if (req.method === 'PATCH') return validate(bookingStatusSchema)(req, res, next);
  next();
});
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') return next();
  return requireAuth(req, res, next);
});
app.use('/api', router);

app.get('/', (req, res) => {
  res.json({ name: 'TourX Mock Server', status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TourX mock server listening on http://0.0.0.0:${PORT}`);
});
