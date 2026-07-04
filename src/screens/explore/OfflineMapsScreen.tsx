import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { CITY_OPTIONS } from '../../constants/locations';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useGetPoisQuery } from '../../services/catalogApi';
import type { OfflineRegion } from '../../types';
import { getOfflineRegions, saveOfflineRegions } from '../../utils/offlineRegions';

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
    // Simulated download: Expo Go cannot cache real map tiles without a custom
    // dev client, so this marks the region + its POI data as offline-available.
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

  const center = cityPois[0] ?? { lat: 7.8731, lng: 80.7718 };

  return (
    <ScreenContainer scroll={false} padded={false}>
      <View style={styles.mapWrap}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
          region={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
        >
          {cityPois.map((poi) => (
            <Marker key={poi.id} coordinate={{ latitude: poi.lat, longitude: poi.lng }} title={poi.name} description={poi.category} />
          ))}
        </MapView>
        {Platform.OS === 'android' ? (
          <View style={styles.mapNotice}>
            <Text style={styles.mapNoticeText}>
              Map tiles need a Google Maps API key on Android — see README. Markers and offline
              downloads still work regardless.
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.panel}>
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
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  mapWrap: { flex: 1 },
  mapNotice: { position: 'absolute', top: spacing.sm, left: spacing.sm, right: spacing.sm, backgroundColor: colors.overlay, borderRadius: radius.sm, padding: spacing.sm },
  mapNoticeText: { color: colors.textInverse, fontSize: 12 },
  panel: { padding: spacing.md, backgroundColor: colors.background },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  cityChip: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  cityChipText: { ...typography.caption, color: colors.text },
  cityChipTextActive: { color: colors.textInverse },
  statusCard: { flexDirection: 'row', alignItems: 'center' },
  statusTitle: { ...typography.label, color: colors.text },
  statusSubtitle: { ...typography.caption, color: colors.textMuted },
});
