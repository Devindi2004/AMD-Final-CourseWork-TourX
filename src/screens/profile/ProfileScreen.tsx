import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { ProfileStackParamList } from '../../navigation/types';
import { useLogoutMutation, useUpdateMeMutation } from '../../services/apiSlice';
import { loggedOut, userUpdated } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { ROLE_LABELS } from '../../types';
import { clearTokens } from '../../utils/authStorage';

const INTEREST_OPTIONS = ['Historical Landmark', 'Religious Site', 'Scenic Landmark', 'Wildlife', 'Beach'];

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  const [homeCountry, setHomeCountry] = useState(user?.homeCountry ?? '');
  const [interests, setInterests] = useState<string[]>(user?.preferences.interests ?? []);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleSave = async () => {
    const updated = await updateMe({
      homeCountry,
      preferences: { ...user?.preferences, interests, budgetTier: user?.preferences.budgetTier ?? 'mid' },
    }).unwrap();
    dispatch(userUpdated(updated));
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) await logout({ refreshToken }).unwrap();
    } catch {
      // Revocation failing server-side shouldn't block clearing the local session.
    } finally {
      await clearTokens();
      dispatch(loggedOut());
    }
  };

  return (
    <ScreenContainer>
      <Card style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user ? <Badge label={ROLE_LABELS[user.role]} tone="primary" /> : null}
      </Card>

      <Text style={styles.label}>Home country</Text>
      <TextField label="" value={homeCountry} onChangeText={setHomeCountry} placeholder="Sri Lanka" />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Interests</Text>
      <ChipSelector options={INTEREST_OPTIONS} selected={interests} onToggle={toggleInterest} />

      <Button label="Save profile" onPress={handleSave} loading={isLoading} style={{ marginTop: spacing.lg }} />

      <Button
        label="AI Translator"
        variant="outline"
        icon={<Ionicons name="language" size={16} color={colors.primary} />}
        onPress={() => navigation.navigate('Translator')}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label="Settings"
        variant="outline"
        icon={<Ionicons name="settings-outline" size={16} color={colors.primary} />}
        onPress={() => navigation.navigate('Settings')}
        style={{ marginTop: spacing.sm }}
      />
      <Button label="Sign out" variant="danger" onPress={handleLogout} loading={loggingOut} style={{ marginTop: spacing.lg }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.md, gap: spacing.xs },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.textInverse, fontSize: 26, fontWeight: '700' },
  name: { ...typography.h3, color: colors.text },
  email: { ...typography.caption, color: colors.textMuted },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
});
