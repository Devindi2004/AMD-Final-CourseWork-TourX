import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useGetBookingsQuery, useUpdateBookingStatusMutation } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';
import type { BookingStatus } from '../../types';

const STATUS_TONE: Record<BookingStatus, 'primary' | 'danger' | 'success'> = {
  confirmed: 'primary',
  cancelled: 'danger',
  completed: 'success',
};

export default function BookingHistoryScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: bookings, isLoading } = useGetBookingsQuery(user?.id ?? '', { skip: !user });
  const [updateStatus] = useUpdateBookingStatusMutation();

  if (isLoading) return <LoadingView label="Loading bookings..." />;

  const handleCancel = (id: string) => {
    Alert.alert('Cancel booking', 'Are you sure you want to cancel this booking?', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => updateStatus({ id, status: 'cancelled' }) },
    ]);
  };

  const sorted = (bookings ?? []).slice().sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  return (
    <ScreenContainer>
      {sorted.length === 0 ? (
        <EmptyState title="No bookings yet" subtitle="Book a hotel or reserve a table from Explore to see it here." />
      ) : (
        sorted.map((b) => (
          <Card key={b.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Ionicons name={b.targetType === 'hotel' ? 'bed' : 'restaurant'} size={18} color={colors.primary} />
              <Text style={styles.name}>{b.targetName}</Text>
              <Badge label={b.status} tone={STATUS_TONE[b.status]} />
            </View>
            <Text style={styles.meta}>
              {b.targetType === 'hotel'
                ? `${b.startDate} → ${b.endDate} · ${b.partySize} guests`
                : `${b.startDate} ${b.time ?? ''} · ${b.partySize} people`}
            </Text>
            {b.targetType === 'hotel' && b.roomTypeName ? (
              <Text style={styles.roomText}>
                {b.roomTypeName}
                {b.totalEstimateUsd ? ` · $${b.totalEstimateUsd} total` : ''}
              </Text>
            ) : null}
            {b.roomFeatures && b.roomFeatures.length > 0 ? (
              <View style={styles.featureRow}>
                {b.roomFeatures.map((f) => (
                  <View key={f} style={styles.featureChip}>
                    <Text style={styles.featureChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {b.notes ? <Text style={styles.notes}>{b.notes}</Text> : null}
            {b.status === 'confirmed' ? (
              <Button label="Cancel booking" variant="outline" onPress={() => handleCancel(b.id)} style={{ marginTop: spacing.sm }} />
            ) : null}
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.label, color: colors.text, flex: 1 },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  roomText: { ...typography.caption, color: colors.primaryDark, marginTop: spacing.xs, fontWeight: '700' },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  featureChip: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  featureChipText: { fontSize: 11, color: colors.text },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
});
