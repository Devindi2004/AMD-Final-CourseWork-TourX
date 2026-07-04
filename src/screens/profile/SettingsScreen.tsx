import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { useLogoutMutation } from '../../services/apiSlice';
import { loggedOut } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearTokens } from '../../utils/authStorage';
import { saveOfflineRegions } from '../../utils/offlineRegions';

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const [cleared, setCleared] = useState(false);

  const handleClearOfflineData = async () => {
    await saveOfflineRegions([]);
    setCleared(true);
  };

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
      <Card>
        <Text style={styles.appName}>TourX</Text>
        <Text style={styles.tagline}>AI-powered smart tourism guide</Text>
        <Text style={styles.meta}>Version 1.0.0 (Prototype)</Text>
        <Text style={styles.meta}>Built with React Native (Expo), Redux Toolkit, RTK Query</Text>
        <Text style={styles.meta}>Backend: json-server + Express mock API</Text>
      </Card>

      <Text style={styles.sectionTitle}>Storage</Text>
      <Button label="Clear downloaded offline maps" variant="outline" onPress={handleClearOfflineData} />
      {cleared ? <Text style={styles.confirmText}>Offline map data cleared.</Text> : null}

      <Text style={styles.sectionTitle}>Account</Text>
      <Button label="Sign out" variant="danger" onPress={handleLogout} loading={loggingOut} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  appName: { ...typography.h2, color: colors.text },
  tagline: { ...typography.body, color: colors.textMuted },
  meta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  confirmText: { ...typography.caption, color: colors.success, marginTop: spacing.sm },
});
