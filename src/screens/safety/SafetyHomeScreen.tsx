import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { SafetyStackParamList } from '../../navigation/types';
import { useCreateNotificationMutation, useGetEmergencyContactsQuery } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';

export default function SafetyHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SafetyStackParamList>>();
  const user = useAppSelector((s) => s.auth.user);
  const { data: contacts } = useGetEmergencyContactsQuery(user?.id ?? '', { skip: !user });
  const [createNotification] = useCreateNotificationMutation();
  const [sending, setSending] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<string | null>(null);

  const handleSos = async () => {
    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let locationLine = 'Location unavailable';
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = position.coords;
        locationLine = `https://maps.google.com/?q=${latitude},${longitude}`;
      }
      const contactNames = (contacts ?? []).map((c) => c.contactName).join(', ') || 'no contacts registered';
      const message = `TourX SOS: I need help. My current location is ${locationLine}. Please contact me immediately.`;

      await Share.share({ message });

      await createNotification({
        userId: user?.id,
        type: 'sos',
        message: `SOS alert prepared for: ${contactNames}.`,
        isRead: false,
        createdAt: new Date().toISOString(),
      }).unwrap();
      setLastSentAt(new Date().toLocaleTimeString());
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>
        One tap shares your live location with your emergency contacts via your phone's share sheet
        (SMS, WhatsApp, etc).
      </Text>

      <Pressable style={styles.sosButton} onPress={handleSos} disabled={sending}>
        <Ionicons name="alert-circle" size={48} color={colors.textInverse} />
        <Text style={styles.sosLabel}>{sending ? 'Preparing alert...' : 'SEND SOS'}</Text>
      </Pressable>

      {lastSentAt ? <Text style={styles.sentText}>Last SOS prepared at {lastSentAt}</Text> : null}

      <Card style={styles.contactsCard}>
        <View style={styles.contactsHeader}>
          <Text style={styles.contactsTitle}>Emergency contacts</Text>
          <Pressable onPress={() => navigation.navigate('EmergencyContacts')}>
            <Text style={styles.manageLink}>Manage</Text>
          </Pressable>
        </View>
        {(contacts ?? []).length === 0 ? (
          <Text style={styles.warning}>No emergency contacts yet — add at least one before you travel.</Text>
        ) : (
          contacts!.map((c) => (
            <Text key={c.id} style={styles.contactLine}>
              {c.contactName} ({c.relationship}) · {c.contactPhone}
            </Text>
          ))
        )}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  sosButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    aspectRatio: 1,
    width: '65%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  sosLabel: { ...typography.h3, color: colors.textInverse, letterSpacing: 1 },
  sentText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.md },
  contactsCard: { marginTop: spacing.md },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  contactsTitle: { ...typography.h3, color: colors.text },
  manageLink: { ...typography.label, color: colors.primary },
  warning: { ...typography.body, color: colors.warning },
  contactLine: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
});
