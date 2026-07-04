import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Text } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useCreateBookingMutation } from '../../services/personalApi';

export default function BookingFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  // Cross-tab navigation to the Booking History screen in the Profile tab.
  const rootNavigation = navigation.getParent<any>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'BookingForm'>>();
  const { targetType, targetId, targetName } = params;
  const isHotel = targetType === 'hotel';

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [partySize, setPartySize] = useState('2');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [createBooking, { isLoading }] = useCreateBookingMutation();

  const handleSubmit = async () => {
    setError(null);
    if (!startDate) {
      setError(isHotel ? 'Check-in date is required.' : 'Reservation date is required.');
      return;
    }
    try {
      await createBooking({
        targetType,
        targetId,
        targetName,
        startDate,
        endDate: isHotel ? endDate || null : null,
        time: isHotel ? null : time,
        partySize: Number(partySize) || 1,
        notes,
      }).unwrap();
      rootNavigation?.navigate('ProfileTab', { screen: 'BookingHistory' });
    } catch (err: any) {
      setError(err?.data?.message || 'Could not create this booking.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{isHotel ? 'Book a stay' : 'Reserve a table'}</Text>
      <Text style={styles.subtitle}>{targetName}</Text>

      <TextField
        label={isHotel ? 'Check-in date' : 'Reservation date'}
        value={startDate}
        onChangeText={setStartDate}
        placeholder="2026-08-01"
      />
      {isHotel ? (
        <TextField label="Check-out date" value={endDate} onChangeText={setEndDate} placeholder="2026-08-04" />
      ) : (
        <TextField label="Time" value={time} onChangeText={setTime} placeholder="19:00" />
      )}
      <TextField
        label={isHotel ? 'Guests' : 'Party size'}
        value={partySize}
        onChangeText={setPartySize}
        keyboardType="numeric"
      />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any special requests?" />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Confirm booking" onPress={handleSubmit} loading={isLoading} style={{ marginTop: spacing.md }} />
    </ScreenContainer>
  );
}

const styles = {
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  errorText: { color: colors.danger, marginTop: spacing.sm },
} as const;
