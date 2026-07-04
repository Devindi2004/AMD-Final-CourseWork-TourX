import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { EmptyState, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useDeleteJournalEntryMutation, useGetJournalEntriesQuery } from '../../services/personalApi';

export default function TravelJournalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const { params } = useRoute<RouteProp<TripsStackParamList, 'TravelJournal'>>();
  const { tripId } = params;

  const { data: entries, isLoading } = useGetJournalEntriesQuery({ tripId });
  const [deleteEntry] = useDeleteJournalEntryMutation();

  if (isLoading) return <LoadingView label="Loading journal..." />;

  return (
    <View style={{ flex: 1 }}>
      <ScreenContainer>
        {(entries ?? []).length === 0 ? (
          <EmptyState title="No journal entries yet" subtitle="Capture your memories with photos and notes." />
        ) : (
          (entries ?? [])
            .slice()
            .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
            .map((entry) => (
              <Card key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>{entry.title}</Text>
                  <Pressable onPress={() => deleteEntry(entry.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
                {entry.photos.length > 0 ? (
                  <Image source={{ uri: entry.photos[0] }} style={styles.photo} />
                ) : null}
                <Text style={styles.entryText}>{entry.entryText}</Text>
                <Text style={styles.entryMeta}>
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.location ? ` · ${entry.location.lat.toFixed(3)}, ${entry.location.lng.toFixed(3)}` : ''}
                </Text>
              </Card>
            ))
        )}
      </ScreenContainer>
      <Pressable style={styles.fab} onPress={() => navigation.navigate('JournalEditor', { tripId })}>
        <Ionicons name="add" size={26} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  entryCard: { marginBottom: spacing.md },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  entryTitle: { ...typography.h3, color: colors.text, flexShrink: 1 },
  photo: { width: '100%', height: 160, borderRadius: radius.sm, marginVertical: spacing.sm },
  entryText: { ...typography.body, color: colors.text },
  entryMeta: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
