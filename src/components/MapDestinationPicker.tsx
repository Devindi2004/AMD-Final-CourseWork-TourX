import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, type LatLng } from 'react-native-maps';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useGetPoisQuery } from '../services/catalogApi';

interface MapDestinationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
}

const SRI_LANKA_REGION = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 3.2, longitudeDelta: 3.2 };

function distanceSq(a: LatLng, b: LatLng) {
  const dLat = a.latitude - b.latitude;
  const dLng = a.longitude - b.longitude;
  return dLat * dLat + dLng * dLng;
}

export default function MapDestinationPicker({ visible, onClose, onSelect }: MapDestinationPickerProps) {
  const { data: pois } = useGetPoisQuery();
  const [pin, setPin] = useState<LatLng | null>(null);

  // One representative marker per city, placed at its first known POI.
  const cityMarkers = useMemo(() => {
    const seen = new Set<string>();
    return (pois ?? []).filter((p) => {
      if (seen.has(p.city)) return false;
      seen.add(p.city);
      return true;
    });
  }, [pois]);

  const nearestCity = useMemo(() => {
    if (!pin || !pois || pois.length === 0) return null;
    let best = pois[0];
    let bestDist = distanceSq(pin, { latitude: pois[0].lat, longitude: pois[0].lng });
    for (const poi of pois) {
      const d = distanceSq(pin, { latitude: poi.lat, longitude: poi.lng });
      if (d < bestDist) {
        bestDist = d;
        best = poi;
      }
    }
    return best.city;
  }, [pin, pois]);

  const confirm = (city: string) => {
    onSelect(city);
    setPin(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pin your destination</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.hint}>Tap a marker, or tap anywhere on the map to drop a pin near the closest known destination.</Text>

        <MapView
          style={styles.map}
          initialRegion={SRI_LANKA_REGION}
          onPress={(e) => setPin(e.nativeEvent.coordinate)}
        >
          {cityMarkers.map((poi) => (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.lat, longitude: poi.lng }}
              title={poi.city}
              pinColor={colors.primary}
              onPress={() => confirm(poi.city)}
            />
          ))}
          {pin ? <Marker coordinate={pin} pinColor={colors.secondary} /> : null}
        </MapView>

        {pin && nearestCity ? (
          <Pressable style={styles.confirmBar} onPress={() => confirm(nearestCity)}>
            <Ionicons name="location" size={18} color={colors.textInverse} />
            <Text style={styles.confirmText}>Use {nearestCity}</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, paddingTop: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  map: { flex: 1 },
  confirmBar: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  confirmText: { ...typography.label, color: colors.textInverse },
});
