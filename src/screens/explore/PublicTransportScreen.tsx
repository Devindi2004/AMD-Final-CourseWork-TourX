import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { CITY_OPTIONS } from '../../constants/locations';
import { colors, spacing, typography } from '../../constants/theme';
import { useGetTransportRoutesQuery } from '../../services/miscApi';

const MODE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Train: 'train',
  Bus: 'bus',
  'Metro Bus (Local)': 'bus',
};

export default function PublicTransportScreen() {
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const { data: routes, isLoading } = useGetTransportRoutesQuery({
    from: from ?? undefined,
    to: to ?? undefined,
  });

  return (
    <ScreenContainer>
      <Text style={styles.label}>From</Text>
      <ChipSelector options={CITY_OPTIONS} selected={from ? [from] : []} onToggle={(c) => setFrom((p) => (p === c ? null : c))} />
      <Text style={[styles.label, { marginTop: spacing.sm }]}>To</Text>
      <ChipSelector options={CITY_OPTIONS} selected={to ? [to] : []} onToggle={(c) => setTo((p) => (p === c ? null : c))} />

      <View style={{ marginTop: spacing.md }}>
        {isLoading ? (
          <LoadingView label="Searching routes..." />
        ) : (routes ?? []).length === 0 ? (
          <EmptyState title="No routes found" subtitle="Try clearing a filter or picking a major route (e.g. Colombo → Kandy)." />
        ) : (
          routes!.map((route) => (
            <Card key={route.id} style={styles.card}>
              <View style={styles.headerRow}>
                <Ionicons name={MODE_ICONS[route.mode] ?? 'navigate'} size={18} color={colors.primary} />
                <Text style={styles.routeTitle}>{route.from} → {route.to}</Text>
              </View>
              <Text style={styles.line}>{route.line} ({route.mode})</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{Math.floor(route.durationMinutes / 60)}h {route.durationMinutes % 60}m</Text>
                <Text style={styles.meta}>${route.fareUsd}</Text>
                <Text style={styles.meta}>{route.frequency}</Text>
              </View>
              <Text style={styles.notes}>{route.notes}</Text>
            </Card>
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  card: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  routeTitle: { ...typography.h3, color: colors.text },
  line: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  meta: { ...typography.caption, color: colors.primaryDark, fontWeight: '600' },
  notes: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
});
