import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';

const TILES: {
  key: keyof ExploreStackParamList;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'Gallery', label: 'Gallery', description: 'Photos from across Sri Lanka', icon: 'images' },
  { key: 'HotelList', label: 'Hotels', description: 'Hybrid recommendations', icon: 'bed' },
  { key: 'RestaurantList', label: 'Food', description: 'Local cuisine nearby', icon: 'restaurant' },
  { key: 'Community', label: 'Community', description: 'Reviews & tips', icon: 'people' },
  { key: 'CrowdPrediction', label: 'Crowd Levels', description: 'Plan around busy times', icon: 'bar-chart' },
  { key: 'OfflineMaps', label: 'Live Map', description: 'Traffic, POIs & offline downloads', icon: 'map' },
  { key: 'ArNavigation', label: 'AR Navigate', description: 'Camera-guided wayfinding', icon: 'compass' },
  { key: 'PublicTransport', label: 'Transport', description: 'Bus, train & fares', icon: 'bus' },
  { key: 'LandmarkRecognition', label: 'Scan Landmark', description: 'Identify from a photo', icon: 'camera' },
  { key: 'QrScanner', label: 'QR Scanner', description: 'Scan on-site codes', icon: 'qr-code' },
];

export default function ExploreHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();

  return (
    <ScreenContainer>
      <Text style={styles.title}>Explore Sri Lanka</Text>
      <Text style={styles.subtitle}>Recommendations, safety intel, and on-the-ground tools.</Text>
      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Pressable key={tile.key} style={styles.tile} onPress={() => navigation.navigate(tile.key as never)}>
            <View style={styles.iconWrap}>
              <Ionicons name={tile.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
            <Text style={styles.tileDescription}>{tile.description}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, fontSize: 24, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F4F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  tileLabel: { ...typography.label, color: colors.text },
  tileDescription: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
