import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { GalleryItem } from '../../types';

interface GalleryImageCardProps {
  item: GalleryItem;
  height: number;
  onPress: () => void;
}

export default function GalleryImageCard({ item, height, onPress }: GalleryImageCardProps) {
  return (
    <Pressable onPress={onPress} style={[styles.wrap, { height }]}>
      <Image source={{ uri: item.thumbnailUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(15,23,22,0.75)']}
        style={styles.gradient}
      />
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={11} color={colors.textInverse} />
          <Text style={styles.metaText} numberOfLines={1}>{item.district}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="heart" size={11} color={colors.textInverse} />
            <Text style={styles.statText}>{item.likesCount}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="eye" size={11} color={colors.textInverse} />
            <Text style={styles.statText}>{item.views}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  categoryBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  categoryText: { ...typography.caption, fontSize: 10, fontWeight: '700', color: colors.primaryDark },
  footer: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm },
  title: { ...typography.label, color: colors.textInverse, fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  metaText: { ...typography.caption, fontSize: 11, color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { ...typography.caption, fontSize: 10, color: colors.textInverse },
});
