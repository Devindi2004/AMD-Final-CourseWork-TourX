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
| Frontend | React Native (Expo SDK 54), TypeScript, Expo Go |
| State management | Redux Toolkit + RTK Query (typed hooks, cache tags, loading/error states) |
| Navigation | React Navigation (native-stack + bottom-tabs, 5 tabs each with a nested stack) |
| Auth | JWT access + rotating refresh tokens, email verification (OTP), forgot/reset password, Google OAuth, role-based access (5 roles) — session persisted in `expo-secure-store` |
| Backend | Node.js + Express + `json-server` (REST CRUD store + simulated AI endpoints) |
| Database | `db.json` (file-backed, persists between restarts) |
| Native device APIs | Camera, GPS location, image picker, text-to-speech, share sheet, maps |
| Media | Cloudinary (signed direct upload) for profile pictures |

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
│   │   ├── auth/             # Login, Register, OTP verification, Forgot/Reset password
│   │   ├── admin/            # Admin-only user list + role management
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
    ├── index.js               # Express app: mounts auth/admin routers, simulated AI endpoints,
    │                          #   json-server CRUD mount (role-gated for hotels/restaurants)
    ├── routes/                 # auth.js (register/verify/login/refresh/logout/password/google),
    │                          # admin.js (list users, change role)
    ├── middleware/auth.js       # requireAuth (JWT bearer), requireRole(...roles)
    ├── lib/                     # tokens.js (JWT + opaque refresh tokens), validation.js (zod),
    │                          # email.js (simulated sender), googleAuth.js (ID token verification)
    ├── db.json                 # CRUD-backed collections (users, refreshTokens, trips, hotels, ...)
    └── data/                    # Static reference datasets (12 Sri Lanka POIs, transport routes, ...)
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

## Authentication system

Five roles: **Tourist**, **Guide**, **Hotel Owner**, **Restaurant Owner** (self-registerable), and
**Admin** (seeded only — not selectable at registration, to stop anyone signing up as an admin).

**Flow**: Register → a 6-digit code is emailed (simulated — see below) → verify the code (this
auto-logs you in) → you're issued a short-lived JWT **access token** (15 min) and a long-lived,
opaque, database-backed **refresh token** (30 days). Logging in before verifying returns a
`EMAIL_NOT_VERIFIED` error, which the Login screen catches and routes straight to the OTP screen.

**Refresh tokens rotate**: every call to `/auth/refresh` revokes the token that was used and issues
a brand new pair — so a leaked/replayed refresh token stops working the moment the legitimate
client refreshes again. The frontend never manually calls `/auth/refresh` itself: `src/services/apiSlice.ts`
wraps RTK Query's `fetchBaseQuery` in a `baseQueryWithReauth` that catches any `401`, refreshes
transparently, updates Redux + SecureStore, and retries the original request — a mutex
(`async-mutex`) prevents two requests that 401 simultaneously from both trying to consume the same
one-time-use refresh token. This is also how "persistent login" works: `RootNavigator` restores the
saved tokens on launch and calls `/auth/me`; if the access token expired while the app was closed,
the very first request transparently refreshes it.

**Forgot / reset password**: requests a 6-digit code the same way as verification; resetting the
password revokes every refresh token that user currently holds (forces re-login on all devices) and
the endpoint always returns the same generic message regardless of whether the email exists, to
avoid leaking which emails are registered.

**Email delivery is simulated for development**: `server/lib/email.js` logs the message (and the
code) to the server console instead of sending a real email, and the relevant API responses include
a `devVerificationCode` / `devResetCode` field so the flow is fully testable without an inbox. Swap
the body of `sendEmail()` for `nodemailer` + real SMTP credentials to send real email — every call
site elsewhere stays the same.

**Role-gated protected routes**: `requireAuth` (verifies the JWT) and `requireRole(...roles)`
(checks the decoded role) are composable Express middleware. Two concrete examples are wired in
`server/index.js`: creating/editing/deleting a hotel requires the `hotel_owner` (or `admin`) role,
and the same for restaurants — a `tourist` token gets a `403` with a `FORBIDDEN_ROLE` code. Admin
gets two more routes (`GET /admin/users`, `PATCH /admin/users/:id/role`), surfaced in the app as an
**Admin** tab that only renders when the logged-in user's role is `admin`.

### Google OAuth setup

The full flow is wired (frontend `expo-auth-session` + backend `google-auth-library` ID-token
verification) but needs a real Google Cloud OAuth client — without one, the button shows a
"not configured" message instead of crashing.

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials),
   create an OAuth 2.0 Client ID of type **Web application**.
2. Add an authorized redirect URI. For testing via `npx expo start --web`, that's whatever origin
   Metro serves on, e.g. `http://localhost:8081`.
3. Copy the client ID into **both**:
   - `.env` at the project root: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...` (copy `.env.example` first)
   - `server/.env`: `GOOGLE_CLIENT_ID=...` (copy `server/.env.example` first) — the backend verifies
     the token's audience against this value.
4. Restart both `npx expo start` and the mock server so the env vars are picked up.

**Important limitation in Expo Go**: Google's OAuth redirect-URI matching requires an exact,
pre-registered URI. In Expo Go, the native redirect is `exp://<your-LAN-IP>:8081/--/...` — an IP
that changes per network, which Google won't let you pre-register, so the native (Android/iOS)
button will reliably work when testing via **`npx expo start --web`**, but not inside Expo Go on a
physical device. A real native Google Sign-In (working inside Expo Go or a standalone build) needs
either a custom EAS dev-client build with a fixed native URL scheme registered as an Android/iOS
OAuth client, or the native `@react-native-google-signin/google-signin` SDK — both are outside
Expo Go's managed-client model. This is a genuine platform constraint, not a configuration gap.

## User Profile module

Profile → **Edit Profile** covers profile picture, name, phone, home country, preferred language
(English/Sinhala/Tamil), and interests. Everything else lives one tap away from the Profile hub:

- **Wishlist / Favorites / Saved Places** — one `SavedItem` model (`targetType` + `targetId` +
  `listType`), not three separate systems, since they're functionally identical (bookmark an item,
  see it in a filtered list). Toggle buttons for all three appear on every landmark/hotel/restaurant
  detail screen; the Profile → **Wishlist, Favorites & Saved Places** screen shows all three as tabs.
- **Booking History** — a real new capability, distinct from the existing Trip itineraries: "Book
  this hotel" / "Reserve a table" buttons on hotel/restaurant detail screens create a `Booking`
  (dates, party size, status), cancellable from Profile → **Booking History**.
- **Trip History** — not a separate screen; the existing Trips tab list now has status filter chips
  (All/Planned/Ongoing/History), and Profile → Trip History jumps there pre-filtered to completed
  trips.
- **Reviews & Ratings** — Profile → **My Reviews & Ratings** lists every review you've written
  (across landmarks/hotels/restaurants) with the star rating you gave, and lets you delete your own.
- **Notification Settings** — four toggles (crowd alerts, weather alerts, trip reminders,
  promotional) persisted on your user record via `PATCH /auth/me`.

### Cloudinary setup (profile pictures)

Uses a **signed direct upload**: the app asks the backend for a short-lived signature
(`POST /uploads/signature`, requires being logged in), then uploads the image straight to
Cloudinary using that signature — the Cloudinary API secret never leaves the server, and image
bytes never round-trip through our own backend. Without credentials, the upload button just shows
"Upload failed" with a clear "not configured" message instead of silently doing nothing.

1. Create a free account at [cloudinary.com](https://cloudinary.com/) — no credit card required.
2. From the dashboard, copy your **Cloud name**, **API Key**, and **API Secret**.
3. Add them to `server/.env` (copy `server/.env.example` first):
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart the mock server. Uploaded photos land in a `tourx/avatars/<userId>` folder per user.

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
Seeded demo accounts (all password-verified, ready to log in):
  tourist            demo@tourx.app            / Passw0rd!
  admin              admin@tourx.app           / AdminPass1
  guide              guide@tourx.app           / GuidePass1
  hotel_owner        hotelowner@tourx.app      / HotelPass1
  restaurant_owner   restaurantowner@tourx.app / RestoPass1
```

Leave this running in its own terminal. `server/db.json` persists data between restarts — delete it
(or the `users` and related arrays inside it) to reset to a clean slate; it will reseed all five
demo accounts automatically the next time the server starts.

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

### Which Expo SDK version, and why

The project is pinned to **Expo SDK 54**, not whatever `create-expo-app` scaffolds by default at
the time you read this. The Expo Go client on the App Store / Play Store only supports whatever SDK
version it was last published against — if your installed Expo Go is older than the project's SDK,
you'll see `Project is incompatible with this version of Expo Go`. Check your installed Expo Go
app's version (App Store / Play Store listing) before bumping `expo` in `package.json`; if you do
change it, run `npx expo install --fix` afterwards to align every `expo-*` package, then
`npx expo-doctor` to confirm.

## Testing in a browser

The mobile UI can also run in a desktop browser for quick iteration, without a phone at all:

```bash
npx expo start --web
```

This opens `http://localhost:8081` (or press `w` in an already-running `npx expo start` session).
The mock server must still be running (`cd server && npm start`) — the web build talks to it over
`localhost:4000` directly since both run on the same machine.

Two things behave differently on web, both handled automatically:

- **Auth persistence**: `expo-secure-store` has no Keychain/Keystore on web, so the session token
  falls back to `AsyncStorage` (`localStorage`) there instead — see `src/utils/authStorage.ts`.
- **Offline Maps**: `react-native-maps` has no web renderer at all (it imports native-only React
  Native internals), so `OfflineMapsScreen.web.tsx` is a separate implementation — same city
  selector, POI data, and download flow, minus the live `MapView`. Metro picks this file
  automatically for web builds because of the `.web.tsx` suffix; the native app still gets the real
  map on Android/iOS.

Camera-dependent screens (QR Scanner, Landmark Recognition, AR Navigation) will prompt for browser
camera/location permissions and work in Chrome/Edge, but AR Navigation's compass bearing won't
rotate on desktop browsers (no device orientation sensor) — it still shows distance and direction
assuming you're facing north.

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

## Demo accounts

One verified account per role, so you can test role-gating without going through registration:

| Role | Email | Password |
|---|---|---|
| Tourist | `demo@tourx.app` | `Passw0rd!` |
| Admin | `admin@tourx.app` | `AdminPass1` |
| Guide | `guide@tourx.app` | `GuidePass1` |
| Hotel Owner | `hotelowner@tourx.app` | `HotelPass1` |
| Restaurant Owner | `restaurantowner@tourx.app` | `RestoPass1` |

The `demo@tourx.app` tourist account is seeded with a sample trip (Cultural Triangle Explorer),
expenses, a journal entry, an emergency contact, and two community reviews — so every tourist-facing
screen has something to show immediately after login. Log in as `admin@tourx.app` to see the
role-gated **Admin** tab (list all users, change roles); log in as `hotelowner@tourx.app` or
`restaurantowner@tourx.app` to get write access to `/api/hotels` or `/api/restaurants` respectively
(no dedicated UI for that yet — it's enforced and testable via the API today).
