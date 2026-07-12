import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DateField from '../../components/DateField';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetHotelQuery } from '../../services/catalogApi';
import { useCreateBookingMutation } from '../../services/personalApi';
import type { RoomType } from '../../types';

function nightsBetween(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

export default function BookingFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'BookingForm'>>();
  const { targetType, targetId, targetName } = params;
  const isHotel = targetType === 'hotel';

  const { data: hotel } = useGetHotelQuery(targetId, { skip: !isHotel });

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [partySize, setPartySize] = useState('2');
  const [notes, setNotes] = useState('');
  const [roomTypeId, setRoomTypeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [createBooking, { isLoading }] = useCreateBookingMutation();

  useEffect(() => {
    if (isHotel && hotel && hotel.roomTypes.length > 0 && !roomTypeId) {
      setRoomTypeId(hotel.roomTypes[0].id);
    }
  }, [isHotel, hotel, roomTypeId]);

  const selectedRoom: RoomType | undefined = hotel?.roomTypes.find((r) => r.id === roomTypeId);
  const nights = isHotel ? nightsBetween(startDate, endDate) : 0;
  const totalEstimateUsd = isHotel && selectedRoom ? selectedRoom.pricePerNightUsd * nights : 0;

  const handleSubmit = async () => {
    setError(null);
    if (!startDate) {
      setError(isHotel ? 'Check-in date is required.' : 'Reservation date is required.');
      return;
    }
    if (isHotel) {
      if (!endDate) {
        setError('Check-out date is required.');
        return;
      }
      if (nights <= 0) {
        setError('Check-out date must be after check-in date.');
        return;
      }
      if (!selectedRoom) {
        setError('Please select a room type.');
        return;
      }
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
        totalEstimateUsd: isHotel ? totalEstimateUsd : 0,
        roomTypeName: isHotel ? selectedRoom?.name ?? null : null,
        roomFeatures: isHotel ? selectedRoom?.features ?? [] : [],
      }).unwrap();
      navigation.navigate('ExploreHome');
    } catch (err: any) {
      setError(err?.data?.message || 'Could not create this booking.');
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>{isHotel ? 'Book a stay' : 'Reserve a table'}</Text>
      <Text style={styles.subtitle}>{targetName}</Text>

      <DateField
        label={isHotel ? 'Check-in date' : 'Reservation date'}
        value={startDate}
        onChange={(d) => {
          setStartDate(d);
          if (isHotel && endDate && nightsBetween(d, endDate) <= 0) setEndDate('');
        }}
        placeholder="2026-08-01"
      />
      {isHotel ? (
        <DateField label="Check-out date" value={endDate} onChange={setEndDate} minDate={startDate} placeholder="2026-08-04" />
      ) : (
        <TextField label="Time" value={time} onChangeText={setTime} placeholder="19:00" />
      )}
      <TextField
        label={isHotel ? 'Guests' : 'Party size'}
        value={partySize}
        onChangeText={setPartySize}
        keyboardType="numeric"
      />

      {isHotel && hotel ? (
        <>
          <Text style={styles.label}>Room type</Text>
          {hotel.roomTypes.map((room) => {
            const selected = room.id === roomTypeId;
            return (
              <Pressable key={room.id} onPress={() => setRoomTypeId(room.id)}>
                <Card style={[styles.roomCard, selected && styles.roomCardSelected]}>
                  <View style={styles.roomHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      <Text style={styles.roomMeta}>Sleeps {room.capacity} · ${room.pricePerNightUsd}/night</Text>
                    </View>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={styles.featureRow}>
                    {room.features.map((f) => (
                      <View key={f} style={styles.featureChip}>
                        <Text style={styles.featureChipText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              </Pressable>
            );
          })}

          {nights > 0 && selectedRoom ? (
            <Card style={styles.totalCard}>
              <Text style={styles.totalLabel}>{nights} night{nights > 1 ? 's' : ''} · {selectedRoom.name}</Text>
              <Text style={styles.totalValue}>${totalEstimateUsd}</Text>
            </Card>
          ) : null}
        </>
      ) : null}

      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Any special requests?" />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Confirm booking" onPress={handleSubmit} loading={isLoading} style={{ marginTop: spacing.md }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.xs },
  errorText: { color: colors.danger, marginTop: spacing.sm },
  roomCard: { marginBottom: spacing.sm, borderWidth: 1 },
  roomCardSelected: { borderColor: colors.primary },
  roomHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  roomName: { ...typography.label, color: colors.text },
  roomMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  featureChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  featureChipText: { ...typography.caption, color: colors.text },
  totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, backgroundColor: colors.background },
  totalLabel: { ...typography.body, color: colors.text },
  totalValue: { ...typography.h3, color: colors.primaryDark },
});
