import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import SaveToggleButtons from '../../components/SaveToggleButtons';
import ScreenContainer from '../../components/ScreenContainer';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetHotelQuery, useGetReviewsQuery } from '../../services/catalogApi';

export default function HotelDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'HotelDetail'>>();
  const { data: hotel, isLoading, isError, refetch } = useGetHotelQuery(params.hotelId);
  const { data: reviews } = useGetReviewsQuery({ targetType: 'hotel', targetId: params.hotelId });

  if (isLoading) return <LoadingView label="Loading hotel..." />;
  if (isError || !hotel) return <ErrorView onRetry={refetch} />;

  return (
    <ScreenContainer>
      <Text style={styles.name}>{hotel.name}</Text>
      <Text style={styles.meta}>{hotel.city} · {hotel.priceRange} · ${hotel.pricePerNightUsd}/night</Text>
      <View style={styles.ratingRow}>
        <Ionicons name="star" size={16} color={colors.secondary} />
        <Text style={styles.rating}>{hotel.averageRating.toFixed(1)} average rating</Text>
      </View>

      <SaveToggleButtons targetType="hotel" targetId={hotel.id} />

      <Card style={{ marginTop: spacing.sm }}>
        <Text style={styles.sectionTitle}>Amenities</Text>
        <Text style={styles.body}>{hotel.amenities.join(', ')}</Text>
        <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>Good for</Text>
        <Text style={styles.body}>{hotel.tags.join(', ')}</Text>
      </Card>

      <Button
        label="Book this hotel"
        onPress={() => navigation.navigate('BookingForm', { targetType: 'hotel', targetId: hotel.id, targetName: hotel.name })}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Write a review"
        variant="outline"
        onPress={() => navigation.navigate('ReviewComposer', { targetType: 'hotel', targetId: hotel.id, targetName: hotel.name })}
        style={{ marginTop: spacing.sm }}
      />

      <Text style={styles.sectionTitle2}>Reviews ({reviews?.length ?? 0})</Text>
      {(reviews ?? []).length === 0 ? (
        <Text style={styles.body}>No reviews yet — be the first!</Text>
      ) : (
        reviews!.map((r) => (
          <Card key={r.id} style={{ marginBottom: spacing.sm }}>
            <View style={styles.ratingRow}>
              {Array.from({ length: r.rating }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={colors.secondary} />
              ))}
            </View>
            <Text style={styles.body}>{r.comment}</Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  name: { ...typography.h2, color: colors.text },
  meta: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  rating: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.label, color: colors.text },
  sectionTitle2: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  body: { ...typography.body, color: colors.text },
});
