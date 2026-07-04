import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import BookingHistoryScreen from '../screens/profile/BookingHistoryScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import MyReviewsScreen from '../screens/profile/MyReviewsScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SavedItemsScreen from '../screens/profile/SavedItemsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import TranslatorScreen from '../screens/profile/TranslatorScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="SavedItems" component={SavedItemsScreen} options={{ title: 'Wishlist & Saved' }} />
      <Stack.Screen name="BookingHistory" component={BookingHistoryScreen} options={{ title: 'Booking History' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="Translator" component={TranslatorScreen} options={{ title: 'AI Translator' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
