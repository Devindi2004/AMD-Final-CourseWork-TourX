import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Button from '../../components/Button';
import ChipSelector from '../../components/ChipSelector';
import DateField from '../../components/DateField';
import MapDestinationPicker from '../../components/MapDestinationPicker';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useCreateTripMutation, useGetTripQuery, useUpdateTripMutation } from '../../services/tripsApi';
import { useAppSelector } from '../../store/hooks';

const TRANSPORT_OPTIONS = ['walking', 'bicycle', 'train', 'bus', 'tuktuk', 'private-car', 'flight'];

export default function TripFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const route = useRoute<RouteProp<TripsStackParamList, 'TripForm'>>();
  const tripId = route.params?.tripId;
  const user = useAppSelector((s) => s.auth.user);

  const { data: existingTrip, isLoading: loadingTrip } = useGetTripQuery(tripId ?? '', { skip: !tripId });
  const [createTrip, { isLoading: creating }] = useCreateTripMutation();
  const [updateTrip, { isLoading: updating }] = useUpdateTripMutation();

  const [title, setTitle] = useState(existingTrip?.title ?? '');
  const [destination, setDestination] = useState(existingTrip?.destination ?? '');
  const [startDate, setStartDate] = useState(existingTrip?.startDate ?? '');
  const [endDate, setEndDate] = useState(existingTrip?.endDate ?? '');
  const [budgetUsd, setBudgetUsd] = useState(existingTrip ? String(existingTrip.budgetUsd) : '');
  const [transportModes, setTransportModes] = useState<string[]>(existingTrip?.transportModes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Hydrate form fields once the existing trip finishes loading (edit mode).
  if (tripId && existingTrip && !hydrated) {
    setTitle(existingTrip.title);
    setDestination(existingTrip.destination);
    setStartDate(existingTrip.startDate);
    setEndDate(existingTrip.endDate);
    setBudgetUsd(String(existingTrip.budgetUsd));
    setTransportModes(existingTrip.transportModes);
    setHydrated(true);
  }

  const toggleTransport = (mode: string) => {
    setTransportModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!title || !destination || !startDate || !endDate) {
      setError('Title, destination, and both dates are required.');
      return;
    }
    const payload = {
      title,
      destination,
      startDate,
      endDate,
      budgetUsd: Number(budgetUsd) || 0,
      transportModes,
    };
    try {
      if (tripId) {
        await updateTrip({ id: tripId, changes: payload }).unwrap();
      } else {
        await createTrip({
          ...payload,
          userId: user?.id,
          itineraryItems: [],
          ecoScore: null,
          status: 'planned',
          createdAt: new Date().toISOString(),
        }).unwrap();
      }
      navigation.goBack();
    } catch (err: any) {
      setError(err?.data?.message || 'Could not save this trip.');
    }
  };

  if (tripId && loadingTrip) return <LoadingView label="Loading trip..." />;

  return (
    <ScreenContainer>
      <Text style={styles.title}>{tripId ? 'Edit trip' : 'New trip'}</Text>

      <TextField label="Trip title" value={title} onChangeText={setTitle} placeholder="Southern Coast Getaway" />

      <Text style={styles.label}>Destination</Text>
      <View style={styles.destinationRow}>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Galle"
          placeholderTextColor={colors.textMuted}
          style={styles.destinationInput}
        />
        <Pressable style={styles.pinButton} onPress={() => setMapPickerOpen(true)}>
          <Ionicons name="location" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
      <MapDestinationPicker
        visible={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSelect={setDestination}
      />

      <DateField label="Start date" value={startDate} onChange={setStartDate} placeholder="2026-08-01" />
      <DateField label="End date" value={endDate} onChange={setEndDate} minDate={startDate} placeholder="2026-08-05" />
      <TextField
        label="Budget (USD)"
        value={budgetUsd}
        onChangeText={setBudgetUsd}
        keyboardType="numeric"
        placeholder="300"
      />

      <Text style={styles.label}>Transport modes</Text>
      <ChipSelector options={TRANSPORT_OPTIONS} selected={transportModes} onToggle={toggleTransport} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={tripId ? 'Save changes' : 'Create trip'}
        onPress={handleSubmit}
        loading={creating || updating}
        style={{ marginTop: spacing.lg }}
      />
    </ScreenContainer>
  );
}

const styles = {
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.xs },
  error: { color: colors.danger, marginTop: spacing.sm },
  destinationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  destinationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  pinButton: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
} as const;
