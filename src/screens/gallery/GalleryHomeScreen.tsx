import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import ChipSelector from '../../components/ChipSelector';
import GalleryImageCard from '../../components/gallery/GalleryImageCard';
import { EmptyState, ErrorView, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetGalleryListQuery, useGetTrendingGalleryQuery } from '../../services/galleryApi';
import { GALLERY_CATEGORIES, type GalleryItem, type GallerySort } from '../../types';
import { splitIntoColumns } from '../../utils/masonryLayout';

const SORT_LABELS: Record<GallerySort, string> = {
  newest: 'Newest', oldest: 'Oldest', popular: 'Most Popular', trending: 'Most Viewed',
};
const RATING_OPTIONS = [4.5, 4, 3];

export default function GalleryHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();

  const [category, setCategory] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<GallerySort>('newest');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [entryFee, setEntryFee] = useState<'free' | 'paid' | null>(null);
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [category, search, sort, minRating, entryFee, familyFriendly]);

  const { data, isLoading, isFetching, isError, refetch } = useGetGalleryListQuery({
    category: category ?? undefined,
    q: search || undefined,
    sort,
    minRating: minRating ?? undefined,
    entryFee: entryFee ?? undefined,
    familyFriendly: familyFriendly || undefined,
    page,
    limit: 12,
  });
  const { data: trending } = useGetTrendingGalleryQuery();

  useEffect(() => {
    if (!data) return;
    setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items.filter((n) => !prev.some((p) => p.id === n.id))]));
  }, [data, page]);

  const hero = trending?.items[0];
  const columns = useMemo(() => splitIntoColumns(items, 2), [items]);

  const openDetail = (id: string) => navigation.navigate('GalleryDetail', { galleryId: id });

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
    if (nearBottom && !isFetching && data && page < data.totalPages) {
      setPage((p) => p + 1);
    }
  };

  const activeFilterCount = [category, minRating, entryFee, familyFriendly || null].filter(Boolean).length;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView onScroll={handleScroll} scrollEventThrottle={200} contentContainerStyle={styles.scrollContent}>
        {hero ? (
          <Pressable style={styles.hero} onPress={() => openDetail(hero.id)}>
            <Image source={{ uri: hero.displayUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient colors={['transparent', colors.overlay]} style={StyleSheet.absoluteFillObject} />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>FEATURED DESTINATION</Text>
              <Text style={styles.heroTitle}>{hero.title}</Text>
              <Text style={styles.heroMeta}>{hero.district}, {hero.province}</Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search destinations, districts, tags..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
            />
          </View>
          <Pressable accessibilityLabel="Open filters" style={styles.filterButton} onPress={() => setFilterOpen(true)}>
            <Ionicons name="options" size={18} color={colors.textInverse} />
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{activeFilterCount}</Text></View>
            ) : null}
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRail} contentContainerStyle={{ gap: spacing.xs }}>
          <Pressable onPress={() => setCategory(null)} style={[styles.chip, category === null && styles.chipActive]}>
            <Text style={[styles.chipText, category === null && styles.chipTextActive]}>All</Text>
          </Pressable>
          {GALLERY_CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory((prev) => (prev === c ? null : c))} style={[styles.chip, category === c && styles.chipActive]}>
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {isLoading && page === 1 ? (
          <LoadingView label="Loading gallery..." />
        ) : isError ? (
          <ErrorView onRetry={refetch} />
        ) : items.length === 0 ? (
          <EmptyState title="No photos match" subtitle="Try a different category, search term, or filter." />
        ) : (
          <View style={styles.grid}>
            {columns.map((column, colIndex) => (
              <View key={colIndex} style={styles.column}>
                {column.map(({ item, height }) => (
                  <GalleryImageCard key={item.id} item={item} height={height} onPress={() => openDetail(item.id)} />
                ))}
              </View>
            ))}
          </View>
        )}
        {isFetching && page > 1 ? <LoadingView label="Loading more..." /> : null}
      </ScrollView>

      <Pressable accessibilityLabel="Upload a photo" style={styles.fab} onPress={() => navigation.navigate('GalleryUpload')}>
        <Ionicons name="camera" size={22} color={colors.textInverse} />
      </Pressable>

      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <Pressable onPress={() => setFilterOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView>
              <Text style={styles.filterLabel}>Sort by</Text>
              <ChipSelector
                options={Object.values(SORT_LABELS)}
                selected={[SORT_LABELS[sort]]}
                onToggle={(label) => {
                  const key = (Object.keys(SORT_LABELS) as GallerySort[]).find((k) => SORT_LABELS[k] === label);
                  if (key) setSort(key);
                }}
              />
              <Text style={styles.filterLabel}>Minimum rating</Text>
              <ChipSelector
                options={RATING_OPTIONS.map((r) => `${r}+`)}
                selected={minRating ? [`${minRating}+`] : []}
                onToggle={(label) => {
                  const r = parseFloat(label);
                  setMinRating((prev) => (prev === r ? null : r));
                }}
              />
              <Text style={styles.filterLabel}>Entry fee</Text>
              <ChipSelector
                options={['Free Entry', 'Paid Entry']}
                selected={entryFee === 'free' ? ['Free Entry'] : entryFee === 'paid' ? ['Paid Entry'] : []}
                onToggle={(label) => {
                  const v = label === 'Free Entry' ? 'free' : 'paid';
                  setEntryFee((prev) => (prev === v ? null : v));
                }}
              />
              <Text style={styles.filterLabel}>Family friendly</Text>
              <ChipSelector
                options={['Family Friendly']}
                selected={familyFriendly ? ['Family Friendly'] : []}
                onToggle={() => setFamilyFriendly((v) => !v)}
              />
            </ScrollView>
            <Button
              label="Apply filters"
              onPress={() => setFilterOpen(false)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  hero: { height: 220, justifyContent: 'flex-end', backgroundColor: colors.border },
  heroContent: { padding: spacing.md },
  heroKicker: { ...typography.caption, color: 'rgba(255,255,255,0.85)', fontWeight: '700', letterSpacing: 1 },
  heroTitle: { ...typography.h1, fontSize: 24, color: colors.textInverse, marginTop: 4 },
  heroMeta: { ...typography.body, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  searchRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },
  filterButton: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute', top: -2, right: -2, backgroundColor: colors.secondary,
    borderRadius: radius.pill, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { color: colors.textInverse, fontSize: 10, fontWeight: '700' },
  categoryRail: { marginTop: spacing.md, paddingHorizontal: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.textInverse },
  grid: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.md },
  column: { flex: 1, gap: spacing.sm },
  fab: {
    position: 'absolute', right: spacing.md, bottom: spacing.md,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.md, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.h2, color: colors.text },
  filterLabel: { ...typography.label, color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
});
