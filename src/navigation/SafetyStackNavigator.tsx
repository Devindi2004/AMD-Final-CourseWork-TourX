import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { colors } from '../constants/theme';
import EmergencyContactsScreen from '../screens/safety/EmergencyContactsScreen';
import SafetyHomeScreen from '../screens/safety/SafetyHomeScreen';
import type { SafetyStackParamList } from './types';

const Stack = createNativeStackNavigator<SafetyStackParamList>();

export default function SafetyStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="SafetyHome" component={SafetyHomeScreen} options={{ title: 'Safety' }} />
      <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} options={{ title: 'Emergency Contacts' }} />
    </Stack.Navigator>
  );
}
