import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import AdminStackNavigator from './AdminStackNavigator';
import { colors } from '../constants/theme';
import ExploreStackNavigator from './ExploreStackNavigator';
import HomeStackNavigator from './HomeStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import SafetyStackNavigator from './SafetyStackNavigator';
import TripsStackNavigator from './TripsStackNavigator';
import { useAppSelector } from '../store/hooks';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  HomeTab: 'home',
  TripsTab: 'briefcase',
  ExploreTab: 'compass',
  SafetyTab: 'shield-checkmark',
  ProfileTab: 'person-circle',
  AdminTab: 'lock-closed',
};

export default function MainTabs() {
  const isAdmin = useAppSelector((s) => s.auth.user?.role === 'admin');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="TripsTab" component={TripsStackNavigator} options={{ title: 'Trips' }} />
      <Tab.Screen name="ExploreTab" component={ExploreStackNavigator} options={{ title: 'Explore' }} />
      <Tab.Screen name="SafetyTab" component={SafetyStackNavigator} options={{ title: 'Safety' }} />
      <Tab.Screen name="ProfileTab" component={ProfileStackNavigator} options={{ title: 'Profile' }} />
      {isAdmin ? (
        <Tab.Screen name="AdminTab" component={AdminStackNavigator} options={{ title: 'Admin' }} />
      ) : null}
    </Tab.Navigator>
  );
}
