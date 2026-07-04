import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useLazyGetPoiByCodeQuery } from '../../services/catalogApi';
import poisData from '../../../server/data/pois.json';

export default function QrScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupCode, { isFetching }] = useLazyGetPoiByCodeQuery();

  const handleCode = async (code: string) => {
    if (scanned) return;
    setScanned(true);
    setError(null);
    try {
      const poi = await lookupCode(code).unwrap();
      navigation.replace('PoiDetail', { poiId: poi.id });
    } catch {
      setError(`No point of interest matches code "${code}".`);
      setTimeout(() => setScanned(false), 1500);
    }
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    handleCode(result.data);
  };

  if (!permission) return <LoadingView label="Checking camera permission..." />;

  return (
    <View style={styles.flexFill}>
      {permission.granted ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      ) : (
        <View style={styles.permissionScreen}>
          <Ionicons name="qr-code-outline" size={40} color={colors.textMuted} />
          <Text style={styles.permissionText}>Camera access is needed to scan tourist QR codes.</Text>
          <Button label="Grant camera access" onPress={requestPermission} />
        </View>
      )}

      {permission.granted ? (
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.overlayText}>Point the camera at a TourX QR code</Text>
          {isFetching ? <Text style={styles.overlayText}>Looking up...</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      ) : null}

      <View style={styles.demoPanel}>
        <Text style={styles.demoTitle}>No QR code handy? Try a demo code:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {poisData.slice(0, 6).map((poi) => (
            <Pressable key={poi.code} style={styles.demoChip} onPress={() => handleCode(poi.code)}>
              <Text style={styles.demoChipText}>{poi.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flexFill: { flex: 1, backgroundColor: '#000' },
  permissionScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background },
  permissionText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  scanFrame: { width: 220, height: 220, borderWidth: 3, borderColor: colors.secondary, borderRadius: radius.md },
  overlayText: { color: colors.textInverse, backgroundColor: colors.overlay, padding: spacing.sm, borderRadius: radius.sm },
  errorText: { color: colors.textInverse, backgroundColor: colors.danger, padding: spacing.sm, borderRadius: radius.sm },
  demoPanel: { backgroundColor: colors.surface, padding: spacing.md },
  demoTitle: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  demoChip: { backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  demoChipText: { ...typography.caption, color: colors.text },
});
