import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { EmptyState } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import {
  useCreateEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
  useGetEmergencyContactsQuery,
} from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';

export default function EmergencyContactsScreen() {
  const user = useAppSelector((s) => s.auth.user);
  const { data: contacts } = useGetEmergencyContactsQuery(user?.id ?? '', { skip: !user });
  const [createContact, { isLoading }] = useCreateEmergencyContactMutation();
  const [deleteContact] = useDeleteEmergencyContactMutation();

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleAdd = async () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    await createContact({ userId: user?.id, contactName, contactPhone, relationship }).unwrap();
    setContactName('');
    setContactPhone('');
    setRelationship('');
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>Add a contact</Text>
      <TextField label="Name" value={contactName} onChangeText={setContactName} placeholder="Nimal Perera" />
      <TextField label="Phone number" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" placeholder="+94 71 234 5678" />
      <TextField label="Relationship" value={relationship} onChangeText={setRelationship} placeholder="Brother" />
      <Button label="Add contact" onPress={handleAdd} loading={isLoading} />

      <Text style={styles.sectionTitle}>Your contacts</Text>
      {(contacts ?? []).length === 0 ? (
        <EmptyState title="No contacts yet" subtitle="Add someone who should be alerted in an emergency." />
      ) : (
        contacts!.map((c) => (
          <Card key={c.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.contactName}</Text>
              <Text style={styles.meta}>{c.relationship} · {c.contactPhone}</Text>
            </View>
            <Pressable style={styles.callButton} onPress={() => Linking.openURL(`tel:${c.contactPhone}`)}>
              <Ionicons name="call" size={18} color={colors.textInverse} />
            </Pressable>
            <Pressable onPress={() => deleteContact(c.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  name: { ...typography.label, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  callButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
});
