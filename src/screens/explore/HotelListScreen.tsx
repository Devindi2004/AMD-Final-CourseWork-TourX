import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, ErrorView, LoadingView } from '../../components/StateViews';
import { CITY_OPTIONS, PRICE_RANGES } from '../../constants/locations';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetHotelsQuery } from '../../services/catalogApi';

export default function HotelListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const [city, setCity] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);

  const { data: hotels, isLoading, isError, refetch } = useGetHotelsQuery({
    city: city ?? undefined,
    priceRange: priceRange ?? undefined,
  });

  return (
    <ScreenContainer>
      <Text style={styles.filterLabel}>City</Text>
      <ChipSelector
        options={CITY_OPTIONS}
        selected={city ? [city] : []}
        onToggle={(c) => setCity((prev) => (prev === c ? null : c))}
      />
      <Text style={[styles.filterLabel, { marginTop: spacing.sm }]}>Budget</Text>
      <ChipSelector
        options={PRICE_RANGES}
        selected={priceRange ? [priceRange] : []}
        onToggle={(p) => setPriceRange((prev) => (prev === p ? null : p))}
      />

      <View style={{ marginTop: spacing.md }}>
        {isLoading ? (
          <LoadingView label="Finding hotels..." />
        ) : isError ? (
          <ErrorView onRetry={refetch} />
        ) : hotels && hotels.length > 0 ? (
          hotels.map((hotel) => (
            <Pressable key={hotel.id} onPress={() => navigation.navigate('HotelDetail', { hotelId: hotel.id })}>
              <Card style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.name}>{hotel.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color={colors.secondary} />
                    <Text style={styles.rating}>{hotel.averageRating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{hotel.city} · {hotel.priceRange} · ${hotel.pricePerNightUsd}/night</Text>
                <Text style={styles.tags}>{hotel.amenities.join(' · ')}</Text>
              </Card>
            </Pressable>
          ))
        ) : (
          <EmptyState title="No hotels match" subtitle="Try a different city or budget filter." />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterLabel: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  card: { marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.h3, color: colors.text, flexShrink: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { ...typography.caption, color: colors.textMuted },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  tags: { ...typography.caption, color: colors.primaryDark, marginTop: spacing.xs },
});
