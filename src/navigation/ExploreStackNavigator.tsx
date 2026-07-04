import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import ArNavigationScreen from '../screens/explore/ArNavigationScreen';
import BookingFormScreen from '../screens/explore/BookingFormScreen';
import CommunityFeedScreen from '../screens/explore/CommunityFeedScreen';
import CrowdPredictionScreen from '../screens/explore/CrowdPredictionScreen';
import ExploreHomeScreen from '../screens/explore/ExploreHomeScreen';
import HotelDetailScreen from '../screens/explore/HotelDetailScreen';
import HotelListScreen from '../screens/explore/HotelListScreen';
import LandmarkRecognitionScreen from '../screens/explore/LandmarkRecognitionScreen';
import OfflineMapsScreen from '../screens/explore/OfflineMapsScreen';
import PoiDetailScreen from '../screens/explore/PoiDetailScreen';
import PublicTransportScreen from '../screens/explore/PublicTransportScreen';
import QrScannerScreen from '../screens/explore/QrScannerScreen';
import RestaurantDetailScreen from '../screens/explore/RestaurantDetailScreen';
import RestaurantListScreen from '../screens/explore/RestaurantListScreen';
import ReviewComposerScreen from '../screens/explore/ReviewComposerScreen';
import type { ExploreStackParamList } from './types';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export default function ExploreStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="ExploreHome" component={ExploreHomeScreen} options={{ title: 'Explore' }} />
      <Stack.Screen name="HotelList" component={HotelListScreen} options={{ title: 'Hotels' }} />
      <Stack.Screen name="HotelDetail" component={HotelDetailScreen} options={{ title: 'Hotel' }} />
      <Stack.Screen name="RestaurantList" component={RestaurantListScreen} options={{ title: 'Restaurants' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'Restaurant' }} />
      <Stack.Screen name="Community" component={CommunityFeedScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="ReviewComposer" component={ReviewComposerScreen} options={{ title: 'Write a Review' }} />
      <Stack.Screen name="CrowdPrediction" component={CrowdPredictionScreen} options={{ title: 'Crowd Levels' }} />
      <Stack.Screen name="OfflineMaps" component={OfflineMapsScreen} options={{ title: 'Offline Maps' }} />
      <Stack.Screen name="ArNavigation" component={ArNavigationScreen} options={{ title: 'AR Navigation', headerShown: false }} />
      <Stack.Screen name="PublicTransport" component={PublicTransportScreen} options={{ title: 'Public Transport' }} />
      <Stack.Screen name="LandmarkRecognition" component={LandmarkRecognitionScreen} options={{ title: 'Scan Landmark' }} />
      <Stack.Screen name="QrScanner" component={QrScannerScreen} options={{ title: 'QR Scanner', headerShown: false }} />
      <Stack.Screen name="PoiDetail" component={PoiDetailScreen} options={{ title: 'Landmark' }} />
      <Stack.Screen name="BookingForm" component={BookingFormScreen} options={{ title: 'Book' }} />
    </Stack.Navigator>
  );
}
