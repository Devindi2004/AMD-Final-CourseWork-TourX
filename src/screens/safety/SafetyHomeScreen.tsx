import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { SRI_LANKA_EMERGENCY_NUMBERS } from '../../constants/emergencyNumbers';
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
        <Text style={styles.contactsTitle}>Sri Lanka emergency numbers</Text>
        {SRI_LANKA_EMERGENCY_NUMBERS.map((entry) => (
          <Pressable
            key={entry.number}
            style={styles.sosNumberRow}
            onPress={() => Linking.openURL(`tel:${entry.number}`)}
          >
            <View style={styles.sosNumberIconWrap}>
              <Ionicons name={entry.icon} size={18} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sosNumberName}>{entry.name}</Text>
              <Text style={styles.sosNumberDescription}>{entry.description}</Text>
            </View>
            <View style={styles.callChip}>
              <Ionicons name="call" size={14} color={colors.textInverse} />
              <Text style={styles.callChipText}>{entry.number}</Text>
            </View>
          </Pressable>
        ))}
      </Card>

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
            <Pressable key={c.id} style={styles.sosNumberRow} onPress={() => Linking.openURL(`tel:${c.contactPhone}`)}>
              <View style={styles.sosNumberIconWrap}>
                <Ionicons name="person" size={18} color={colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sosNumberName}>{c.contactName}</Text>
                <Text style={styles.sosNumberDescription}>{c.relationship}</Text>
              </View>
              <View style={styles.callChip}>
                <Ionicons name="call" size={14} color={colors.textInverse} />
                <Text style={styles.callChipText}>Call</Text>
              </View>
            </Pressable>
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
  sosNumberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, gap: spacing.sm },
  sosNumberIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FDECEC', alignItems: 'center', justifyContent: 'center' },
  sosNumberName: { ...typography.label, color: colors.text },
  sosNumberDescription: { ...typography.caption, color: colors.textMuted },
  callChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.danger, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  callChipText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
});
