import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import ChatbotScreen from '../screens/home/ChatbotScreen';
import HomeDashboardScreen from '../screens/home/HomeDashboardScreen';
import WeatherScreen from '../screens/home/WeatherScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="HomeDashboard" component={HomeDashboardScreen} options={{ title: 'TourX' }} />
      <Stack.Screen name="Chatbot" component={ChatbotScreen} options={{ title: 'AI Travel Assistant' }} />
      <Stack.Screen name="Weather" component={WeatherScreen} options={{ title: 'Weather Forecast' }} />
    </Stack.Navigator>
  );
}
