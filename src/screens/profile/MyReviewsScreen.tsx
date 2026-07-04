import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import { EmptyState, LoadingView } from '../../components/StateViews';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { useDeleteReviewMutation, useGetHotelsQuery, useGetPoisQuery, useGetRestaurantsQuery, useGetReviewsQuery } from '../../services/catalogApi';
import { useAppSelector } from '../../store/hooks';

export default function MyReviewsScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: reviews, isLoading } = useGetReviewsQuery({ userId: user?.id ?? '' }, { skip: !user });
  const { data: pois } = useGetPoisQuery();
  const { data: hotels } = useGetHotelsQuery();
  const { data: restaurants } = useGetRestaurantsQuery();
  const [deleteReview] = useDeleteReviewMutation();

  const nameOf = useMemo(() => {
    const map = new Map<string, string>();
    (pois ?? []).forEach((p) => map.set(`poi-${p.id}`, p.name));
    (hotels ?? []).forEach((h) => map.set(`hotel-${h.id}`, h.name));
    (restaurants ?? []).forEach((r) => map.set(`restaurant-${r.id}`, r.name));
    return map;
  }, [pois, hotels, restaurants]);

  if (isLoading) return <LoadingView label="Loading your reviews..." />;

  const sorted = (reviews ?? []).slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <ScreenContainer>
      {sorted.length === 0 ? (
        <EmptyState title="No reviews yet" subtitle="Reviews you write for places show up here." />
      ) : (
        sorted.map((r) => (
          <Card key={r.id} style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.targetName}>{nameOf.get(`${r.targetType}-${r.targetId}`) ?? 'Unknown place'}</Text>
              <Pressable onPress={() => deleteReview(r.id)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </View>
            <View style={styles.starRow}>
              {Array.from({ length: r.rating }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={colors.secondary} />
              ))}
            </View>
            <Text style={styles.comment}>{r.comment}</Text>
            <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  targetName: { ...typography.label, color: colors.text, flex: 1 },
  starRow: { flexDirection: 'row', gap: 2, marginTop: spacing.xs },
  comment: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  date: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
});
