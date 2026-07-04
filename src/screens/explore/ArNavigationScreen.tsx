import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetPoisQuery } from '../../services/catalogApi';
import type { PointOfInterest } from '../../types';
import { bearingTo, distanceKm } from '../../utils/geo';

export default function ArNavigationScreen() {
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'ArNavigation'>>();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const { coords, loading: locLoading, error: locError } = useCurrentLocation();
  const { data: pois } = useGetPoisQuery();
  const [targetId, setTargetId] = useState<string | undefined>(params?.poiId);
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    (async () => {
      try {
        subscription = await Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading));
      } catch {
        setHeading(null);
      }
    })();
    return () => subscription?.remove();
  }, []);

  if (!cameraPermission) return <LoadingView label="Checking camera permission..." />;
  if (!cameraPermission.granted) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
        <Text style={styles.permissionText}>TourX needs camera access for AR navigation.</Text>
        <Button label="Grant camera access" onPress={requestCameraPermission} />
      </View>
    );
  }

  const target: PointOfInterest | undefined = pois?.find((p) => p.id === targetId);

  if (!target) {
    return (
      <View style={styles.pickerScreen}>
        <Text style={styles.pickerTitle}>Choose a destination</Text>
        {locLoading ? <LoadingView label="Getting your location..." /> : null}
        {(pois ?? [])
          .slice()
          .sort((a, b) => {
            if (!coords) return 0;
            return (
              distanceKm(coords.latitude, coords.longitude, a.lat, a.lng) -
              distanceKm(coords.latitude, coords.longitude, b.lat, b.lng)
            );
          })
          .map((poi) => (
            <Pressable key={poi.id} style={styles.pickerRow} onPress={() => setTargetId(poi.id)}>
              <Text style={styles.pickerName}>{poi.name}</Text>
              <Text style={styles.pickerCity}>
                {poi.city}
                {coords ? ` · ${distanceKm(coords.latitude, coords.longitude, poi.lat, poi.lng).toFixed(1)} km` : ''}
              </Text>
            </Pressable>
          ))}
      </View>
    );
  }

  const bearing = coords ? bearingTo(coords.latitude, coords.longitude, target.lat, target.lng) : 0;
  const rotation = heading !== null ? bearing - heading : bearing;
  const distance = coords ? distanceKm(coords.latitude, coords.longitude, target.lat, target.lng) : null;

  return (
    <View style={styles.flexFill}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" />

      <View style={styles.topBanner}>
        <Text style={styles.targetName}>{target.name}</Text>
        {distance !== null ? <Text style={styles.targetDistance}>{distance.toFixed(1)} km away</Text> : null}
      </View>

      <View style={styles.arrowWrap}>
        <View style={[styles.arrow, { transform: [{ rotate: `${rotation}deg` }] }]}>
          <Ionicons name="navigate" size={72} color={colors.secondary} />
        </View>
        {heading === null ? (
          <Text style={styles.headingWarning}>Compass unavailable — arrow shows direction assuming you're facing north.</Text>
        ) : null}
      </View>

      <Pressable style={styles.changeButton} onPress={() => setTargetId(undefined)}>
        <Text style={styles.changeButtonText}>Change destination</Text>
      </Pressable>

      {locError ? <Text style={styles.locError}>{locError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1, backgroundColor: '#000' },
  centerScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md, backgroundColor: colors.background },
  permissionText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  pickerScreen: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  pickerTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  pickerRow: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  pickerName: { ...typography.label, color: colors.text },
  pickerCity: { ...typography.caption, color: colors.textMuted },
  topBanner: { position: 'absolute', top: spacing.xl, left: spacing.md, right: spacing.md, backgroundColor: colors.overlay, borderRadius: radius.md, padding: spacing.md },
  targetName: { ...typography.h3, color: colors.textInverse },
  targetDistance: { ...typography.body, color: colors.textInverse },
  arrowWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  arrow: { alignItems: 'center', justifyContent: 'center' },
  headingWarning: { ...typography.caption, color: colors.textInverse, backgroundColor: colors.overlay, padding: spacing.sm, borderRadius: radius.sm, textAlign: 'center', marginHorizontal: spacing.xl },
  changeButton: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center', backgroundColor: colors.overlay, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  changeButtonText: { ...typography.label, color: colors.textInverse },
  locError: { position: 'absolute', bottom: spacing.xxl + spacing.lg, alignSelf: 'center', color: colors.textInverse },
});
