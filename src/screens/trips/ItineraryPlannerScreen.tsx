import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useGenerateItineraryMutation } from '../../services/aiApi';
import { useCreateTripMutation, useUpdateTripMutation } from '../../services/tripsApi';
import { useAppSelector } from '../../store/hooks';
import type { BudgetTier, ItineraryItem } from '../../types';

const BUDGET_TIERS: BudgetTier[] = ['budget', 'mid', 'premium'];
const INTEREST_OPTIONS = ['Historical Landmark', 'Religious Site', 'Scenic Landmark', 'Wildlife', 'Beach'];

export default function ItineraryPlannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const { params } = useRoute<RouteProp<TripsStackParamList, 'ItineraryPlanner'>>();
  const tripId = params?.tripId;
  const user = useAppSelector((s) => s.auth.user);

  const [destination, setDestination] = useState('');
  const [days, setDays] = useState('3');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid');
  const [interests, setInterests] = useState<string[]>([]);

  const [generateItinerary, { data: plan, isLoading, error }] = useGenerateItineraryMutation();
  const [createTrip, { isLoading: creating }] = useCreateTripMutation();
  const [updateTrip, { isLoading: saving }] = useUpdateTripMutation();

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleGenerate = () => {
    generateItinerary({ destination, days: Number(days) || 3, budgetTier, interests });
  };

  const handleSave = async () => {
    if (!plan) return;
    const flatItems: ItineraryItem[] = plan.itinerary.flatMap((d) =>
      d.items.map((i) => ({ day: d.day, time: i.time, poiId: i.poiId, name: i.name, activity: i.activity, estimatedCostUsd: i.estimatedCostUsd }))
    );

    if (tripId) {
      await updateTrip({ id: tripId, changes: { itineraryItems: flatItems } }).unwrap();
      navigation.navigate('TripDetail', { tripId });
    } else {
      const today = new Date();
      const end = new Date(today.getTime() + (plan.days - 1) * 86400000);
      const created = await createTrip({
        userId: user?.id,
        title: `AI Plan: ${plan.destination}`,
        destination: plan.destination,
        startDate: today.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
        budgetUsd: plan.estimatedTotalUsd,
        ecoScore: null,
        transportModes: [],
        itineraryItems: flatItems,
        status: 'planned',
        createdAt: new Date().toISOString(),
      }).unwrap();
      navigation.navigate('TripDetail', { tripId: created.id });
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>AI Travel Planner</Text>
      <Text style={styles.subtitle}>
        Generates a personalised itinerary from your preferences (simulates the proposal's LLM
        itinerary planner using rule-based generation over the POI dataset).
      </Text>

      <TextField label="Destination" value={destination} onChangeText={setDestination} placeholder="Ella, Kandy, Sigiriya..." />
      <TextField label="Trip length (days)" value={days} onChangeText={setDays} keyboardType="numeric" />

      <Text style={styles.label}>Budget tier</Text>
      <ChipSelector options={BUDGET_TIERS} selected={[budgetTier]} onToggle={(t) => setBudgetTier(t as BudgetTier)} />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Interests</Text>
      <ChipSelector options={INTEREST_OPTIONS} selected={interests} onToggle={toggleInterest} />

      <Button label="Generate itinerary" onPress={handleGenerate} loading={isLoading} style={{ marginTop: spacing.lg }} />
      {error ? <Text style={styles.error}>Could not generate an itinerary. Try again.</Text> : null}

      {plan ? (
        <View style={{ marginTop: spacing.lg }}>
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{plan.destination} · {plan.days} days</Text>
            <Text style={styles.summarySubtitle}>Estimated total: ${plan.estimatedTotalUsd}</Text>
          </Card>

          {plan.itinerary.map((d) => (
            <View key={d.day} style={{ marginTop: spacing.sm }}>
              <Text style={styles.dayTitle}>{d.title}</Text>
              {d.items.map((item, idx) => (
                <Card key={idx} style={styles.itemCard}>
                  <Text style={styles.itemTime}>{item.time}</Text>
                  <Text style={styles.itemActivity}>{item.activity}</Text>
                  <Text style={styles.itemCost}>${item.estimatedCostUsd}</Text>
                </Card>
              ))}
            </View>
          ))}

          <Button
            label={tripId ? 'Apply to this trip' : 'Save as new trip'}
            onPress={handleSave}
            loading={creating || saving}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  error: { color: colors.danger, marginTop: spacing.sm },
  summaryCard: { backgroundColor: colors.primary, marginBottom: spacing.sm },
  summaryTitle: { ...typography.h3, color: colors.textInverse },
  summarySubtitle: { ...typography.body, color: colors.textInverse },
  dayTitle: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.xs },
  itemCard: { marginBottom: spacing.xs },
  itemTime: { ...typography.caption, color: colors.textMuted },
  itemActivity: { ...typography.body, color: colors.text },
  itemCost: { ...typography.caption, color: colors.primaryDark },
});
