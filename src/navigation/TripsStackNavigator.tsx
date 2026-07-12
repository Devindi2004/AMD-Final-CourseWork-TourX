import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable } from 'react-native';
import { colors } from '../constants/theme';
import ExpenseTrackerScreen from '../screens/trips/ExpenseTrackerScreen';
import ItineraryPlannerScreen from '../screens/trips/ItineraryPlannerScreen';
import JournalEditorScreen from '../screens/trips/JournalEditorScreen';
import TravelJournalScreen from '../screens/trips/TravelJournalScreen';
import TripDetailScreen from '../screens/trips/TripDetailScreen';
import TripFormScreen from '../screens/trips/TripFormScreen';
import TripListScreen from '../screens/trips/TripListScreen';
import type { TripsStackParamList } from './types';

const Stack = createNativeStackNavigator<TripsStackParamList>();

export default function TripsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="TripList"
        component={TripListScreen}
        options={({ route, navigation }) =>
          route.params?.fromProfile
            ? {
                title: 'Trip History',
                headerLeft: () => (
                  <Pressable
                    onPress={() => navigation.getParent<any>()?.navigate('ProfileTab')}
                    hitSlop={8}
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Ionicons name="chevron-back" size={26} color={colors.text} />
                  </Pressable>
                ),
              }
            : { title: 'My Trips' }
        }
      />
      <Stack.Screen name="TripForm" component={TripFormScreen} options={{ title: 'Trip Details' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trip' }} />
      <Stack.Screen name="ItineraryPlanner" component={ItineraryPlannerScreen} options={{ title: 'AI Travel Planner' }} />
      <Stack.Screen name="ExpenseTracker" component={ExpenseTrackerScreen} options={{ title: 'Expense Tracker' }} />
      <Stack.Screen name="TravelJournal" component={TravelJournalScreen} options={{ title: 'Travel Journal' }} />
      <Stack.Screen name="JournalEditor" component={JournalEditorScreen} options={{ title: 'New Entry' }} />
    </Stack.Navigator>
  );
}
