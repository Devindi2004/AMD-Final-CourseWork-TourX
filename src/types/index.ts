// Shared domain types, mirroring the collections in TourX proposal Section 12 (Database Design).

export type BudgetTier = 'budget' | 'mid' | 'premium';

export interface UserPreferences {
  interests: string[];
  budgetTier: BudgetTier;
}

export type Role = 'tourist' | 'guide' | 'hotel_owner' | 'restaurant_owner' | 'admin';

export const SELF_REGISTERABLE_ROLES: Exclude<Role, 'admin'>[] = [
  'tourist',
  'guide',
  'hotel_owner',
  'restaurant_owner',
];

export const ROLE_LABELS: Record<Role, string> = {
  tourist: 'Tourist',
  guide: 'Guide',
  hotel_owner: 'Hotel Owner',
  restaurant_owner: 'Restaurant Owner',
  admin: 'Admin',
};

export interface NotificationSettings {
  crowdAlerts: boolean;
  weatherAlerts: boolean;
  tripReminders: boolean;
  promotional: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  authProvider: 'local' | 'google';
  homeCountry: string;
  phone: string;
  language: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
  notificationSettings: NotificationSettings;
  createdAt: string;
}

export const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'si', label: 'Sinhala' },
  { code: 'ta', label: 'Tamil' },
];

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  email: string;
  devVerificationCode?: string;
}

export interface MessageResponse {
  message: string;
  devVerificationCode?: string;
  devResetCode?: string;
}

export interface PointOfInterest {
  id: string;
  code: string;
  name: string;
  city: string;
  category: string;
  description: string;
  lat: number;
  lng: number;
  recognitionTag: string;
  ecoTags: string[];
  crowdBaseline: number;
  avgVisitMinutes: number;
  entryFeeUsd: number;
}

export interface ItineraryItem {
  day: number;
  time: string;
  poiId: string;
  name: string;
  activity: string;
  estimatedCostUsd: number;
}

export type TripStatus = 'planned' | 'ongoing' | 'completed';

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetUsd: number;
  ecoScore: number | null;
  transportModes: string[];
  itineraryItems: ItineraryItem[];
  status: TripStatus;
  createdAt: string;
}

export type PriceRange = 'budget' | 'mid' | 'premium';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Hotel {
  id: string;
  name: string;
  city: string;
  location: GeoPoint;
  priceRange: PriceRange;
  pricePerNightUsd: number;
  amenities: string[];
  averageRating: number;
  tags: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  location: GeoPoint;
  cuisine: string[];
  priceRange: PriceRange;
  averageRating: number;
  tags: string[];
}

export type ReviewTargetType = 'poi' | 'hotel' | 'restaurant';

export interface Review {
  id: string;
  userId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  category: string;
  amount: number;
  currency: string;
  note: string;
  date: string;
}

export interface TravelJournalEntry {
  id: string;
  tripId: string;
  userId: string;
  title: string;
  entryText: string;
  photos: string[];
  location: GeoPoint | null;
  timestamp: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  contactName: string;
  contactPhone: string;
  relationship: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ---- Simulated AI service response shapes ----

export interface LandmarkRecognitionResult {
  matchConfidence: number;
  landmark: PointOfInterest;
  simulated: true;
  note: string;
}

export interface ItineraryDayPlan {
  day: number;
  title: string;
  items: {
    time: string;
    poiId: string;
    name: string;
    activity: string;
    estimatedCostUsd: number;
  }[];
}

export interface GeneratedItinerary {
  destination: string;
  days: number;
  budgetTier: BudgetTier;
  interests: string[];
  estimatedTotalUsd: number;
  itinerary: ItineraryDayPlan[];
  simulated: true;
  note: string;
}

export interface ChatbotReply {
  reply: string;
  simulated: true;
}

export interface TranslationResult {
  original: string;
  targetLanguage: string;
  translated: string;
  detectedSourceLang: string;
  detectedSourceLangName: string;
}

export interface CrowdPrediction {
  poiId: string;
  name: string;
  crowdScore: number;
  level: 'Low' | 'Medium' | 'High';
  checkedAt: string;
}

export interface TransportRoute {
  id: string;
  from: string;
  to: string;
  mode: string;
  line: string;
  durationMinutes: number;
  fareUsd: number;
  frequency: string;
  notes: string;
}

export interface WeatherResponse {
  city: string;
  source: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

export interface OfflineRegion {
  id: string;
  name: string;
  city: string;
  downloadedAt: string;
  sizeMb: number;
}

// ---- Saved items (Wishlist / Favorites / Saved Places — one model, three filtered views) ----

export type SaveableTargetType = 'poi' | 'hotel' | 'restaurant';
export type ListType = 'wishlist' | 'favorite' | 'saved_place';

export const LIST_TYPE_LABELS: Record<ListType, string> = {
  wishlist: 'Wishlist',
  favorite: 'Favorites',
  saved_place: 'Saved Places',
};

export interface SavedItem {
  id: string;
  userId: string;
  targetType: SaveableTargetType;
  targetId: string;
  listType: ListType;
  createdAt: string;
}

// ---- Bookings (hotel/restaurant reservations — distinct from Trip itineraries) ----

export type BookingTargetType = 'hotel' | 'restaurant';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  userId: string;
  targetType: BookingTargetType;
  targetId: string;
  targetName: string;
  startDate: string;
  endDate: string | null;
  time: string | null;
  partySize: number;
  status: BookingStatus;
  totalEstimateUsd: number;
  notes: string;
  createdAt: string;
}

// ---- Cloudinary signed upload ----

export interface UploadSignature {
  timestamp: number;
  folder: string;
  signature: string;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
}
