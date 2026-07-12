import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { AdminStackParamList } from '../../navigation/types';
import { useAdminChangeUserRoleMutation, useAdminListUsersQuery } from '../../services/apiSlice';
import { useAppSelector } from '../../store/hooks';
import { ROLE_LABELS, type Role } from '../../types';

const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];
const ALL_ROLE_LABELS = ALL_ROLES.map((r) => ROLE_LABELS[r]);
const roleFromLabel = (label: string): Role => ALL_ROLES.find((r) => ROLE_LABELS[r] === label) ?? 'tourist';

export default function AdminUsersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
  const currentUser = useAppSelector((s) => s.auth.user);
  const { data: users, isLoading, isError, refetch } = useAdminListUsersQuery();
  const [changeRole] = useAdminChangeUserRoleMutation();

  if (isLoading) return <LoadingView label="Loading users..." />;
  if (isError || !users) return <ErrorView onRetry={refetch} message="Couldn't load users." />;

  return (
    <ScreenContainer>
      <Pressable style={styles.galleryLink} onPress={() => navigation.navigate('AdminGallery')}>
        <Ionicons name="images" size={18} color={colors.primary} />
        <Text style={styles.galleryLinkText}>Gallery Moderation & Analytics</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <Text style={styles.subtitle}>{users.length} registered accounts. Tap a role chip to change it.</Text>
      {users.map((u) => (
        <Card key={u.id} style={styles.card}>
          <Text style={styles.name}>{u.name}</Text>
          <Text style={styles.email}>{u.email}</Text>
          <ChipSelector
            options={ALL_ROLE_LABELS}
            selected={[ROLE_LABELS[u.role]]}
            onToggle={(label) => {
              if (u.id === currentUser?.id) return; // avoid self-demotion by accident
              changeRole({ id: u.id, role: roleFromLabel(label) });
            }}
          />
          {u.id === currentUser?.id ? <Text style={styles.selfNote}>This is you — role changes for your own account are disabled here.</Text> : null}
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  galleryLink: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, marginBottom: spacing.md,
  },
  galleryLinkText: { ...typography.label, color: colors.text, flex: 1 },
  subtitle: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  card: { marginBottom: spacing.md },
  name: { ...typography.label, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  selfNote: { ...typography.caption, color: colors.warning, marginTop: spacing.xs },
});
