import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, spacing, typography } from '../../constants/theme';
import { useUpdateMeMutation } from '../../services/apiSlice';
import { userUpdated } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import type { NotificationSettings } from '../../types';

const OPTIONS: { key: keyof NotificationSettings; label: string; description: string }[] = [
  { key: 'crowdAlerts', label: 'Crowd alerts', description: 'Low-crowd windows for attractions on your trips.' },
  { key: 'weatherAlerts', label: 'Weather alerts', description: 'Heads-up on rain or extreme weather at your destination.' },
  { key: 'tripReminders', label: 'Trip reminders', description: 'Upcoming itinerary items and booking reminders.' },
  { key: 'promotional', label: 'Promotions', description: 'Occasional offers from hotels and restaurants.' },
];

export default function NotificationSettingsScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [updateMe] = useUpdateMeMutation();

  const handleToggle = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user) return;
    const updated = await updateMe({ notificationSettings: { ...user.notificationSettings, [key]: value } }).unwrap();
    dispatch(userUpdated(updated));
  };

  return (
    <ScreenContainer>
      {OPTIONS.map((opt) => (
        <Card key={opt.key} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{opt.label}</Text>
            <Text style={styles.description}>{opt.description}</Text>
          </View>
          <Switch
            value={user?.notificationSettings[opt.key] ?? false}
            onValueChange={(value) => handleToggle(opt.key, value)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </Card>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { ...typography.label, color: colors.text },
  description: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
