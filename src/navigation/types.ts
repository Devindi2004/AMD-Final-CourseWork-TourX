import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  OtpVerification: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type HomeStackParamList = {
  HomeDashboard: undefined;
  Chatbot: undefined;
  Weather: undefined;
};

export type TripsStackParamList = {
  TripList: { filter?: 'planned' | 'ongoing' | 'completed' } | undefined;
  TripForm: { tripId?: string } | undefined;
  TripDetail: { tripId: string };
  ItineraryPlanner: { tripId?: string } | undefined;
  ExpenseTracker: { tripId: string };
  TravelJournal: { tripId: string };
  JournalEditor: { tripId: string };
};

export type ExploreStackParamList = {
  ExploreHome: undefined;
  HotelList: undefined;
  HotelDetail: { hotelId: string };
  RestaurantList: undefined;
  RestaurantDetail: { restaurantId: string };
  Community: undefined;
  ReviewComposer:
    | { targetType: 'poi' | 'hotel' | 'restaurant'; targetId: string; targetName: string }
    | undefined;
  CrowdPrediction: undefined;
  OfflineMaps: undefined;
  ArNavigation: { poiId?: string } | undefined;
  PublicTransport: undefined;
  LandmarkRecognition: undefined;
  QrScanner: undefined;
  PoiDetail: { poiId: string };
  BookingForm: { targetType: 'hotel' | 'restaurant'; targetId: string; targetName: string };
};

export type SafetyStackParamList = {
  SafetyHome: undefined;
  EmergencyContacts: undefined;
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  SavedItems: undefined;
  BookingHistory: undefined;
  MyReviews: undefined;
  NotificationSettings: undefined;
  Translator: undefined;
  Settings: undefined;
};

export type AdminStackParamList = {
  AdminUsers: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  TripsTab: NavigatorScreenParams<TripsStackParamList>;
  ExploreTab: NavigatorScreenParams<ExploreStackParamList>;
  SafetyTab: NavigatorScreenParams<SafetyStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  AdminTab: NavigatorScreenParams<AdminStackParamList>;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
