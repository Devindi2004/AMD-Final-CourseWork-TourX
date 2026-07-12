import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { CITY_OPTIONS } from '../constants/locations';
import TextField from './TextField';

interface MapDestinationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: string) => void;
}

// react-native-maps has no web renderer, so the web build gets a searchable city
// list instead of a live map pin-drop (see OfflineMapsScreen.web.tsx for the same split).
export default function MapDestinationPicker({ visible, onClose, onSelect }: MapDestinationPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => CITY_OPTIONS.filter((c) => c.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a destination</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <Text style={styles.hint}>Interactive map pinning is available on the mobile app. Pick a destination from the list here.</Text>
        <TextField label="" placeholder="Search destinations..." value={search} onChangeText={setSearch} />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item);
                onClose();
              }}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.rowText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md, paddingTop: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.text },
});
