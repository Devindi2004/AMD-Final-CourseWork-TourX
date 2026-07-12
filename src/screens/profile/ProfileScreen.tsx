import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import type { ProfileStackParamList } from '../../navigation/types';
import { useLogoutMutation } from '../../services/apiSlice';
import { loggedOut } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ROLE_LABELS } from '../../types';
import { clearTokens } from '../../utils/authStorage';

const MENU: { key: keyof ProfileStackParamList; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'EditProfile', label: 'Edit Profile', icon: 'person-outline' },
  { key: 'SavedItems', label: 'Wishlist, Favorites & Saved Places', icon: 'heart-outline' },
  { key: 'BookingHistory', label: 'Booking History', icon: 'calendar-outline' },
  { key: 'MyReviews', label: 'My Reviews & Ratings', icon: 'star-outline' },
  { key: 'NotificationSettings', label: 'Notification Settings', icon: 'notifications-outline' },
  { key: 'Translator', label: 'AI Translator', icon: 'language-outline' },
  { key: 'Settings', label: 'Settings', icon: 'settings-outline' },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  // Cross-tab: jumps into the Trips tab's own list screen, filtered to past trips.
  const rootNavigation = navigation.getParent<any>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      // Ignore server-side revocation failures — still clear the local session below.
    } finally {
      await clearTokens();
      dispatch(loggedOut());
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.header}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user ? <Badge label={ROLE_LABELS[user.role]} tone="primary" /> : null}
      </Card>

      <Pressable
        onPress={() =>
          rootNavigation?.navigate('TripsTab', {
            screen: 'TripList',
            params: { filter: 'completed', fromProfile: true },
          })
        }
      >
        <Card style={styles.menuRow}>
          <Ionicons name="time-outline" size={20} color={colors.primary} />
          <Text style={styles.menuLabel}>Trip History</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      {MENU.map((item) => (
        <Pressable key={item.key} onPress={() => navigation.navigate(item.key as never)}>
          <Card style={styles.menuRow}>
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}

      <Button label="Sign out" variant="danger" onPress={handleLogout} loading={loggingOut} style={{ marginTop: spacing.lg }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md, gap: spacing.xs },
  avatar: { width: 72, height: 72, borderRadius: 36, marginBottom: spacing.sm },
  avatarPlaceholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.textInverse, fontSize: 28, fontWeight: '700' },
  name: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  menuLabel: { ...typography.body, color: colors.text, flex: 1 },
});
