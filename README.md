# TourX

An AI-powered smart tourism guide mobile app for Sri Lanka — built with **React Native (Expo)**,
**Redux Toolkit + RTK Query**, and a **json-server + Express mock backend**, as the final coursework
project for *ITS 2127 — Advanced Mobile Developer*.

TourX implements all 18 feature modules from the project proposal: an AI travel planner, offline
maps, camera-based AR navigation, AI landmark recognition, an AI voice guide, an AI translator,
hotel/food recommendations, smart crowd prediction, an eco travel score, a QR tourist scanner, an
AI chatbot, Emergency SOS, a public transport assistant, an expense tracker, live weather, a travel
journal, and a community review platform.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo SDK 56), TypeScript, Expo Go |
| State management | Redux Toolkit + RTK Query (typed hooks, cache tags, loading/error states) |
| Navigation | React Navigation (native-stack + bottom-tabs, 5 tabs each with a nested stack) |
| Auth | Custom JWT auth against the mock server, session persisted in `expo-secure-store` |
| Backend | Node.js + Express + `json-server` (REST CRUD store + simulated AI endpoints) |
| Database | `db.json` (file-backed, persists between restarts) |
| Native device APIs | Camera, GPS location, image picker, text-to-speech, share sheet, maps |

Why a mock server instead of Firebase: the coursework explicitly allows "a mock server for API
calls" as one of three valid backend approaches. `json-server` gives real REST CRUD (not just
static fixtures) backed by a JSON file, and a thin Express layer adds JWT auth plus endpoints that
simulate the proposal's AI/mapping services — so the app talks to genuine HTTP endpoints exactly
as it would talk to a production API.

## Project structure

```
TourX/
├── App.tsx                  # Redux Provider, SafeAreaProvider, RootNavigator
├── app.json / eas.json      # Expo config + EAS build profiles
├── src/
│   ├── components/          # Button, Card, TextField, ChipSelector, Badge, state views
│   ├── constants/           # theme (colors/spacing/typography), API base URL, city lists
│   ├── hooks/                # useCurrentLocation
│   ├── navigation/           # Root/Auth navigators, 5 tab stacks, param types
│   ├── screens/
│   │   ├── auth/             # Login, Register
│   │   ├── home/             # Dashboard, AI Chatbot, Weather
│   │   ├── trips/            # Trip CRUD, AI Travel Planner, Expenses, Travel Journal
│   │   ├── explore/          # Hotels, Restaurants, Community, Crowd, Offline Maps,
│   │   │                     # AR Navigation, Public Transport, Landmark Scan, QR Scanner
│   │   ├── safety/           # Emergency SOS, Emergency Contacts
│   │   └── profile/          # Profile, AI Translator, Settings
│   ├── services/             # RTK Query API slices (auth, trips, catalog, ai, misc, personal)
│   ├── store/                 # Redux store, auth slice, typed hooks
│   ├── types/                 # Shared TypeScript models (mirrors the DB collections)
│   └── utils/                 # eco score, geo/bearing math, weather codes, auth storage
└── server/
    ├── index.js               # Express app: auth, simulated AI endpoints, json-server CRUD mount
    ├── db.json                # CRUD-backed collections (users, trips, hotels, reviews, ...)
    └── data/                  # Static reference datasets (12 Sri Lanka POIs, transport routes, ...)
```

## Feature → screen map

| Proposal feature | Where it lives |
|---|---|
| AI Travel Planner | Trips → **AI Planner** (generates a day-by-day itinerary, saves to a trip) |
| Offline Maps | Explore → **Offline Maps** (download/remove regions, POI pins on a map) |
| AR Navigation | Explore → **AR Navigate** (camera + compass-bearing arrow overlay to a POI) |
| AI Landmark Recognition | Explore → **Scan Landmark** (photo → matched POI + confidence) |
| AI Voice Guide | POI detail → **AI Voice Guide** button (text-to-speech narration) |
| AI Translator | Profile → **AI Translator** (EN → Sinhala/Tamil phrasebook + speech playback) |
| Smart Hotel Recommendation | Explore → **Hotels** (city/budget filters) |
| Local Food Recommendation | Explore → **Food** (city/budget filters) |
| Smart Crowd Prediction | Explore → **Crowd Levels** (live-estimated levels per attraction) |
| Eco Travel Score | Trip detail (computed client-side from transport modes + activity tags) |
| QR Tourist Scanner | Explore → **QR Scanner** (real scan + demo-code fallback) |
| AI Travel Chatbot | Home → **Ask TourX Assistant** |
| Emergency SOS | Safety tab → **SEND SOS** (shares live location via the native share sheet) |
| Public Transport Assistant | Explore → **Transport** (routes, fares, frequency) |
| Expense Tracker | Trip detail → **Expenses** (budget progress bar, full CRUD) |
| Weather Forecast | Home → **Weather** (real live data, no API key, via Open-Meteo) |
| Travel Journal | Trip detail → **Journal** (photo + geotagged entries) |
| Community Platform | Explore → **Community** (review feed + composer) |

The central CRUD model required by the coursework rubric is the **Trip / Itinerary**: full
create/read/update/delete on trips, plus add/remove on itinerary items, all via RTK Query mutations
against the mock server.

## Honest limitations (and why)

Expo Go is a pre-built client with a fixed set of native modules — it cannot load custom native
code without switching to a development build. Two proposal features are therefore **simulated**
rather than using the real native APIs the proposal names:

- **AR Navigation**: no ARKit/ARCore scene tracking. Instead, the camera feed is used as a live
  background with a compass-bearing arrow (computed from GPS + device heading) pointing at the
  selected landmark, plus live distance — a common "AR-lite" pattern for wayfinding.
- **Offline Maps**: no real map-tile caching (that needs a native tile cache package). Downloading
  a region marks it (and its POI data) as available offline in local storage; the POIs and their
  descriptions genuinely stay usable without a connection.

Everything else (AI chatbot, itinerary planner, landmark recognition, translator, crowd prediction,
transport routes) is **served over real HTTP from the mock server**; only the underlying "AI" is
rule-based/deterministic rather than a live LLM/vision API call, which the proposal itself treats as
acceptable ("orchestrating third-party cloud AI services... reflecting the time and computational
constraints of the project" — Section 9.2).

## Setup

Requires Node.js 18+ and the **Expo Go** app (Android/iOS) on your phone, on the **same Wi-Fi**
network as your computer.

### 1. Install dependencies

```bash
# from the project root
npm install

# mock server has its own package.json
cd server
npm install
cd ..
```

### 2. Start the mock server

```bash
cd server
npm start
```

You should see:

```
TourX mock server listening on http://0.0.0.0:4000
Demo login -> email: demo@tourx.app  password: Passw0rd!
```

Leave this running in its own terminal. `server/db.json` persists data between restarts — delete it
(or the arrays inside it) to reset to a clean slate; it will reseed the demo account automatically
the next time the server starts.

### 3. Start the app

```bash
npx expo start
```

Scan the QR code with Expo Go (Android: Expo Go's scanner; iOS: the Camera app). The app
automatically points itself at your computer's LAN IP on port 4000 for the mock server (via
`Constants.expoConfig.hostUri`), so no manual IP configuration is needed as long as your phone and
computer share a network.

If you're using an Android emulator instead of a physical device, it will fall back to
`10.0.2.2:4000` automatically.

Log in with the seeded demo account (prefilled on the login screen):

```
email: demo@tourx.app
password: Passw0rd!
```

or register a new account — it's a real endpoint that hashes the password and issues a JWT.

### Android map tiles

`OfflineMaps` uses `react-native-maps`. On iOS (Apple Maps) it works with no setup. On Android,
Google Maps tiles require a Google Maps SDK API key (free tier). Without one, the screen still
works — city selection, POI markers, and the offline-download flow all function — but the base map
image may render blank. To enable tiles, get a free key from the
[Google Cloud Console](https://console.cloud.google.com/google/maps-apis) and add it to `app.json`:

```json
"android": { "config": { "googleMaps": { "apiKey": "YOUR_KEY" } } }
```

## Building an APK

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) (no local Android Studio
install required):

```bash
npm install -g eas-cli
eas login          # free Expo account
eas build --platform android --profile preview
```

This produces a downloadable `.apk` (see `eas.json` — the `preview` profile is configured for
`buildType: apk`, internal distribution). Alternatively, if you have Android Studio installed
locally: `npx expo prebuild` then build the generated `android/` project with Gradle.

## Demo account

| Field | Value |
|---|---|
| Email | `demo@tourx.app` |
| Password | `Passw0rd!` |

Seeded with a sample trip (Cultural Triangle Explorer), expenses, a journal entry, an emergency
contact, and two community reviews — so every screen has something to show immediately after login.
