import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetHotelsQuery, useGetPoisQuery, useGetRestaurantsQuery, useGetReviewsQuery } from '../../services/catalogApi';

export default function CommunityFeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { data: reviews, isLoading } = useGetReviewsQuery();
  const { data: pois } = useGetPoisQuery();
  const { data: hotels } = useGetHotelsQuery();
  const { data: restaurants } = useGetRestaurantsQuery();

  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    (pois ?? []).forEach((p) => map.set(`poi-${p.id}`, p.name));
    (hotels ?? []).forEach((h) => map.set(`hotel-${h.id}`, h.name));
    (restaurants ?? []).forEach((r) => map.set(`restaurant-${r.id}`, r.name));
    return map;
  }, [pois, hotels, restaurants]);

  if (isLoading) return <LoadingView label="Loading community feed..." />;

  const sorted = (reviews ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.list}>
        {sorted.length === 0 ? (
          <EmptyState title="No reviews yet" subtitle="Be the first traveller to share a tip." />
        ) : (
          sorted.map((r) => (
            <Card key={r.id} style={styles.card}>
              <View style={styles.headerRow}>
                <Ionicons
                  name={r.targetType === 'hotel' ? 'bed' : r.targetType === 'restaurant' ? 'restaurant' : 'location'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.targetName}>
                  {nameOf.get(`${r.targetType}-${r.targetId}`) ?? 'Unknown place'}
                </Text>
              </View>
              <View style={styles.starRow}>
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Ionicons key={i} name="star" size={13} color={colors.secondary} />
                ))}
              </View>
              <Text style={styles.comment}>{r.comment}</Text>
              <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
            </Card>
          ))
        )}
      </View>
      <Pressable style={styles.fab} onPress={() => navigation.navigate('ReviewComposer', undefined)}>
        <Ionicons name="create" size={24} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.xxl },
  card: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  targetName: { ...typography.label, color: colors.text },
  starRow: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
  comment: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  date: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
