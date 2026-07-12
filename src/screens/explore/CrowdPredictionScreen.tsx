import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Badge, { crowdTone } from '../../components/Badge';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetPoisQuery } from '../../services/catalogApi';
import { useGetCrowdPredictionQuery } from '../../services/miscApi';
import type { PointOfInterest } from '../../types';

const POLL_INTERVAL_MS = 20000;

function secondsAgoLabel(iso: string | undefined, tick: number) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((tick - new Date(iso).getTime()) / 1000));
  if (seconds < 5) return 'Updated just now';
  if (seconds < 60) return `Updated ${seconds}s ago`;
  return `Updated ${Math.round(seconds / 60)}m ago`;
}

function CrowdRow({ poi, onPress, tick }: { poi: PointOfInterest; onPress: () => void; tick: number }) {
  const { data: crowd, isFetching, refetch } = useGetCrowdPredictionQuery(poi.id, {
    pollingInterval: POLL_INTERVAL_MS,
  });
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{poi.name}</Text>
          <Text style={styles.city}>{poi.city}</Text>
          {crowd ? <Text style={styles.updated}>{secondsAgoLabel(crowd.checkedAt, tick)}</Text> : null}
        </View>
        {crowd ? (
          <View style={styles.crowdCol}>
            <Badge label={crowd.level} tone={crowdTone(crowd.level)} />
            <Text style={styles.score}>{Math.round(crowd.crowdScore * 100)}%</Text>
          </View>
        ) : (
          <Text style={styles.loading}>...</Text>
        )}
        <Pressable onPress={refetch} hitSlop={8} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color={isFetching ? colors.textMuted : colors.primary} />
        </Pressable>
      </Card>
    </Pressable>
  );
}

export default function CrowdPredictionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { data: pois, isLoading } = useGetPoisQuery();
  const [tick, setTick] = useState(() => Date.now());

  // Drives the "Updated Xs ago" labels without needing every row to re-render on its own timer.
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  if (isLoading) return <LoadingView label="Loading attractions..." />;

  return (
    <ScreenContainer>
      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.subtitle}>
          Live crowd levels, refreshing automatically every {POLL_INTERVAL_MS / 1000}s based on time of day and typical visitation patterns.
        </Text>
      </View>
      {(pois ?? []).map((poi) => (
        <CrowdRow key={poi.id} poi={poi} tick={tick} onPress={() => navigation.navigate('PoiDetail', { poiId: poi.id })} />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  liveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginBottom: spacing.md },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginTop: 5 },
  subtitle: { ...typography.caption, color: colors.textMuted, flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { ...typography.label, color: colors.text },
  city: { ...typography.caption, color: colors.textMuted },
  updated: { ...typography.caption, color: colors.textMuted, marginTop: 2, fontSize: 11 },
  crowdCol: { alignItems: 'flex-end', marginRight: spacing.sm },
  score: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  loading: { ...typography.caption, color: colors.textMuted },
  refreshButton: { padding: spacing.xs },
});
