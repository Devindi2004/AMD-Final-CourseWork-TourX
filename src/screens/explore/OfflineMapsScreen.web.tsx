import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { CITY_OPTIONS } from '../../constants/locations';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useGetPoisQuery } from '../../services/catalogApi';
import type { OfflineRegion } from '../../types';
import { getOfflineRegions, saveOfflineRegions } from '../../utils/offlineRegions';

// react-native-maps has no web renderer (it imports native-only RN internals), so the
// web build gets this POI-list variant instead of a live MapView. Metro picks this file
// automatically for web builds because of the ".web.tsx" suffix.
export default function OfflineMapsScreen() {
  const { data: pois, isLoading } = useGetPoisQuery();
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);
  const [regions, setRegions] = useState<OfflineRegion[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    getOfflineRegions().then(setRegions);
  }, []);

  const cityPois = (pois ?? []).filter((p) => p.city === selectedCity);
  const isDownloaded = regions.some((r) => r.city === selectedCity);

  const handleDownload = async () => {
    setDownloading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const next: OfflineRegion = {
      id: `region-${selectedCity}`,
      name: selectedCity,
      city: selectedCity,
      downloadedAt: new Date().toISOString(),
      sizeMb: Math.round(15 + Math.random() * 25),
    };
    const updated = [...regions.filter((r) => r.city !== selectedCity), next];
    setRegions(updated);
    await saveOfflineRegions(updated);
    setDownloading(false);
  };

  const handleRemove = async () => {
    const updated = regions.filter((r) => r.city !== selectedCity);
    setRegions(updated);
    await saveOfflineRegions(updated);
  };

  if (isLoading) return <LoadingView label="Loading map data..." />;

  return (
    <ScreenContainer>
      <View style={styles.mapNotice}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={styles.mapNoticeText}>
          Interactive map view is available on the mobile app (Android/iOS) only. This web build
          shows the same points of interest and offline-download flow as a list.
        </Text>
      </View>

      <View style={styles.cityRow}>
        {CITY_OPTIONS.map((city) => (
          <Pressable key={city} onPress={() => setSelectedCity(city)} style={[styles.cityChip, city === selectedCity && styles.cityChipActive]}>
            <Text style={[styles.cityChipText, city === selectedCity && styles.cityChipTextActive]}>{city}</Text>
          </Pressable>
        ))}
      </View>

      <Card style={styles.statusCard}>
        <Ionicons name={isDownloaded ? 'checkmark-circle' : 'cloud-download-outline'} size={22} color={isDownloaded ? colors.success : colors.textMuted} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.statusTitle}>{selectedCity}</Text>
          <Text style={styles.statusSubtitle}>
            {isDownloaded
              ? `Available offline · ${regions.find((r) => r.city === selectedCity)?.sizeMb} MB`
              : `${cityPois.length} points of interest · not downloaded`}
          </Text>
        </View>
        {isDownloaded ? (
          <Button label="Remove" variant="outline" onPress={handleRemove} />
        ) : (
          <Button label="Download" onPress={handleDownload} loading={downloading} />
        )}
      </Card>

      <Text style={styles.sectionTitle}>Points of interest in {selectedCity}</Text>
      {cityPois.length === 0 ? (
        <Text style={styles.statusSubtitle}>No POIs recorded for this city.</Text>
      ) : (
        cityPois.map((poi) => (
          <Card key={poi.id} style={{ marginBottom: spacing.sm }}>
            <Text style={styles.statusTitle}>{poi.name}</Text>
            <Text style={styles.statusSubtitle}>{poi.category} · {poi.lat.toFixed(3)}, {poi.lng.toFixed(3)}</Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapNotice: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  mapNoticeText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  cityChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { ...typography.caption, color: colors.text },
  cityChipTextActive: { color: colors.textInverse },
  statusCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  statusTitle: { ...typography.label, color: colors.text },
  statusSubtitle: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
});
