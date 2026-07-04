import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useCreateSavedItemMutation, useDeleteSavedItemMutation, useGetSavedItemsQuery } from '../services/personalApi';
import { useAppSelector } from '../store/hooks';
import type { ListType, SaveableTargetType } from '../types';

const TOGGLES: { listType: ListType; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { listType: 'wishlist', icon: 'bag-handle-outline', activeIcon: 'bag-handle', label: 'Wishlist' },
  { listType: 'favorite', icon: 'heart-outline', activeIcon: 'heart', label: 'Favorite' },
  { listType: 'saved_place', icon: 'bookmark-outline', activeIcon: 'bookmark', label: 'Saved' },
];

interface SaveToggleButtonsProps {
  targetType: SaveableTargetType;
  targetId: string;
}

export default function SaveToggleButtons({ targetType, targetId }: SaveToggleButtonsProps) {
  const user = useAppSelector((s) => s.auth.user);
  const { data: savedItems } = useGetSavedItemsQuery({ userId: user?.id ?? '' }, { skip: !user });
  const [createSavedItem] = useCreateSavedItemMutation();
  const [deleteSavedItem] = useDeleteSavedItemMutation();

  const handleToggle = (listType: ListType) => {
    const existing = savedItems?.find(
      (s) => s.targetType === targetType && s.targetId === targetId && s.listType === listType
    );
    if (existing) {
      deleteSavedItem(existing.id);
    } else {
      createSavedItem({ targetType, targetId, listType });
    }
  };

  return (
    <View style={styles.row}>
      {TOGGLES.map((t) => {
        const active = !!savedItems?.find(
          (s) => s.targetType === targetType && s.targetId === targetId && s.listType === t.listType
        );
        return (
          <Pressable key={t.listType} onPress={() => handleToggle(t.listType)} style={styles.button}>
            <Ionicons name={active ? t.activeIcon : t.icon} size={20} color={active ? colors.secondary : colors.textMuted} />
            <Text style={[styles.label, active && styles.labelActive]}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginVertical: spacing.sm },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  label: { ...typography.caption, color: colors.textMuted },
  labelActive: { color: colors.text, fontWeight: '700' },
});
