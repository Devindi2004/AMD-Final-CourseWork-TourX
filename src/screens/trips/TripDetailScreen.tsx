import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useGetPoisQuery } from '../../services/catalogApi';
import { useDeleteTripMutation, useGetTripQuery, useUpdateTripMutation } from '../../services/tripsApi';
import { computeEcoScore, ecoScoreLabel } from '../../utils/ecoScore';
import type { ItineraryItem, PointOfInterest } from '../../types';

export default function TripDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const { params } = useRoute<RouteProp<TripsStackParamList, 'TripDetail'>>();
  const { tripId } = params;

  const { data: trip, isLoading, isError, refetch } = useGetTripQuery(tripId);
  const { data: pois } = useGetPoisQuery();
  const [updateTrip] = useUpdateTripMutation();
  const [deleteTrip, { isLoading: deleting }] = useDeleteTripMutation();

  const [showAddItem, setShowAddItem] = useState(false);
  const [day, setDay] = useState('1');
  const [time, setTime] = useState('09:00');
  const [activity, setActivity] = useState('');
  const [cost, setCost] = useState('0');

  const poisById = useMemo(() => {
    const map: Record<string, PointOfInterest | undefined> = {};
    (pois ?? []).forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [pois]);

  const ecoScore = trip ? computeEcoScore(trip.transportModes, trip.itineraryItems, poisById) : 0;
  const eco = ecoScoreLabel(ecoScore);

  if (isLoading) return <LoadingView label="Loading trip details..." />;
  if (isError || !trip) return <ErrorView onRetry={refetch} message="Couldn't load this trip." />;

  const persistItinerary = async (items: ItineraryItem[]) => {
    await updateTrip({
      id: trip.id,
      changes: { itineraryItems: items, ecoScore: computeEcoScore(trip.transportModes, items, poisById) },
    }).unwrap();
  };

  const handleAddItem = async () => {
    if (!activity.trim()) return;
    const newItem: ItineraryItem = {
      day: Number(day) || 1,
      time,
      poiId: 'custom',
      name: activity,
      activity,
      estimatedCostUsd: Number(cost) || 0,
    };
    await persistItinerary([...trip.itineraryItems, newItem]);
    setActivity('');
    setCost('0');
    setShowAddItem(false);
  };

  const handleRemoveItem = async (index: number) => {
    const next = trip.itineraryItems.filter((_, i) => i !== index);
    await persistItinerary(next);
  };

  const handleDelete = () => {
    Alert.alert('Delete trip', `Delete "${trip.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteTrip(trip.id).unwrap();
          navigation.goBack();
        },
      },
    ]);
  };

  const groupedByDay = trip.itineraryItems.reduce<Record<number, { item: ItineraryItem; index: number }[]>>(
    (acc, item, index) => {
      acc[item.day] = acc[item.day] ? [...acc[item.day], { item, index }] : [{ item, index }];
      return acc;
    },
    {}
  );

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{trip.title}</Text>
        <Badge label={trip.status} tone="primary" />
      </View>
      <Text style={styles.meta}>{trip.destination}</Text>
      <Text style={styles.meta}>
        {trip.startDate} → {trip.endDate} · Budget ${trip.budgetUsd}
      </Text>

      <Card style={styles.ecoCard}>
        <Ionicons name="leaf" size={22} color={colors.success} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.ecoTitle}>Eco Travel Score: {ecoScore}/100</Text>
          <Text style={styles.ecoSubtitle}>{eco.label} · based on transport & activity choices</Text>
        </View>
        <Badge label={eco.label} tone={eco.tone} />
      </Card>

      <View style={styles.actionRow}>
        <Button
          label="AI Planner"
          variant="outline"
          onPress={() => navigation.navigate('ItineraryPlanner', { tripId: trip.id })}
          style={styles.actionButton}
        />
        <Button
          label="Expenses"
          variant="outline"
          onPress={() => navigation.navigate('ExpenseTracker', { tripId: trip.id })}
          style={styles.actionButton}
        />
        <Button
          label="Journal"
          variant="outline"
          onPress={() => navigation.navigate('TravelJournal', { tripId: trip.id })}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Itinerary</Text>
        <Pressable onPress={() => setShowAddItem((s) => !s)}>
          <Ionicons name={showAddItem ? 'close-circle' : 'add-circle'} size={26} color={colors.primary} />
        </Pressable>
      </View>

      {showAddItem ? (
        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.addItemRow}>
            <TextField label="Day" value={day} onChangeText={setDay} keyboardType="numeric" style={styles.smallInput} />
            <TextField label="Time" value={time} onChangeText={setTime} style={styles.smallInput} />
          </View>
          <TextField label="Activity" value={activity} onChangeText={setActivity} placeholder="Visit local market" />
          <TextField label="Estimated cost (USD)" value={cost} onChangeText={setCost} keyboardType="numeric" />
          <Button label="Add to itinerary" onPress={handleAddItem} />
        </Card>
      ) : null}

      {Object.keys(groupedByDay).length === 0 ? (
        <Text style={styles.meta}>No itinerary items yet. Use the AI Planner or add one manually.</Text>
      ) : (
        Object.entries(groupedByDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([dayNum, entries]) => (
            <View key={dayNum} style={{ marginBottom: spacing.md }}>
              <Text style={styles.dayLabel}>Day {dayNum}</Text>
              {entries.map(({ item, index }) => (
                <Card key={`${dayNum}-${index}`} style={styles.itineraryCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTime}>{item.time}</Text>
                    <Text style={styles.itemActivity}>{item.activity}</Text>
                    <Text style={styles.itemCost}>${item.estimatedCostUsd}</Text>
                  </View>
                  <Pressable onPress={() => handleRemoveItem(index)}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </Card>
              ))}
            </View>
          ))
      )}

      <Button label="Edit trip details" variant="outline" onPress={() => navigation.navigate('TripForm', { tripId: trip.id })} style={{ marginTop: spacing.md }} />
      <Button label="Delete trip" variant="danger" onPress={handleDelete} loading={deleting} style={{ marginTop: spacing.sm }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.text, flexShrink: 1 },
  meta: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  ecoCard: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md },
  ecoTitle: { ...typography.label, color: colors.text },
  ecoSubtitle: { ...typography.caption, color: colors.textMuted },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  actionButton: { flex: 1, paddingHorizontal: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
  dayLabel: { ...typography.label, color: colors.primaryDark, marginBottom: spacing.xs },
  itineraryCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  itemTime: { ...typography.caption, color: colors.textMuted },
  itemActivity: { ...typography.body, color: colors.text },
  itemCost: { ...typography.caption, color: colors.primaryDark, marginTop: 2 },
  addItemRow: { flexDirection: 'row', gap: spacing.sm },
  smallInput: { flex: 1 },
});
