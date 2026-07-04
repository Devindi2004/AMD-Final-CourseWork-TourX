import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import { useGetHotelsQuery, useGetPoisQuery, useGetRestaurantsQuery } from '../../services/catalogApi';
import { useDeleteSavedItemMutation, useGetSavedItemsQuery } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';
import { LIST_TYPE_LABELS, type ListType } from '../../types';

const TABS: ListType[] = ['wishlist', 'favorite', 'saved_place'];

export default function SavedItemsScreen() {
  // Cross-tab navigation: this screen lives in the Profile stack, but the items it
  // lists are detail screens registered in the Explore stack.
  const navigation = useNavigation<any>();
  const user = useAppSelector((s) => s.auth.user);
  const [tab, setTab] = useState<ListType>('wishlist');

  const { data: savedItems, isLoading } = useGetSavedItemsQuery({ userId: user?.id ?? '' }, { skip: !user });
  const { data: pois } = useGetPoisQuery();
  const { data: hotels } = useGetHotelsQuery();
  const { data: restaurants } = useGetRestaurantsQuery();
  const [deleteSavedItem] = useDeleteSavedItemMutation();

  const resolved = useMemo(() => {
    const map = new Map<string, { name: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap }>();
    (pois ?? []).forEach((p) => map.set(`poi-${p.id}`, { name: p.name, subtitle: p.city, icon: 'location' }));
    (hotels ?? []).forEach((h) => map.set(`hotel-${h.id}`, { name: h.name, subtitle: h.city, icon: 'bed' }));
    (restaurants ?? []).forEach((r) => map.set(`restaurant-${r.id}`, { name: r.name, subtitle: r.city, icon: 'restaurant' }));
    return map;
  }, [pois, hotels, restaurants]);

  if (isLoading) return <LoadingView label="Loading saved items..." />;

  const items = (savedItems ?? []).filter((s) => s.listType === tab);

  const goToDetail = (targetType: string, targetId: string) => {
    if (targetType === 'poi') navigation.navigate('ExploreTab', { screen: 'PoiDetail', params: { poiId: targetId } });
    else if (targetType === 'hotel')
      navigation.navigate('ExploreTab', { screen: 'HotelDetail', params: { hotelId: targetId } });
    else navigation.navigate('ExploreTab', { screen: 'RestaurantDetail', params: { restaurantId: targetId } });
  };

  return (
    <ScreenContainer>
      <ChipSelector
        options={TABS.map((t) => LIST_TYPE_LABELS[t])}
        selected={[LIST_TYPE_LABELS[tab]]}
        onToggle={(label) => setTab((TABS.find((t) => LIST_TYPE_LABELS[t] === label) ?? 'wishlist'))}
      />

      <View style={{ marginTop: spacing.md }}>
        {items.length === 0 ? (
          <EmptyState title={`No ${LIST_TYPE_LABELS[tab].toLowerCase()} yet`} subtitle="Tap the icons on a place's detail screen to save it here." />
        ) : (
          items.map((item) => {
            const info = resolved.get(`${item.targetType}-${item.targetId}`);
            return (
              <Pressable key={item.id} onPress={() => goToDetail(item.targetType, item.targetId)}>
                <Card style={styles.row}>
                  <Ionicons name={info?.icon ?? 'bookmark'} size={20} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.name}>{info?.name ?? 'Unknown place'}</Text>
                    <Text style={styles.subtitle}>{info?.subtitle}</Text>
                  </View>
                  <Pressable onPress={() => deleteSavedItem(item.id)}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                </Card>
              </Pressable>
            );
          })
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { ...typography.label, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted },
});
