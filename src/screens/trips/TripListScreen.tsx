import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Card from '../../components/Card';
import { EmptyState, ErrorView, LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useGetTripsQuery } from '../../services/tripsApi';
import { useAppSelector } from '../../store/hooks';

const statusTone: Record<string, 'neutral' | 'primary' | 'success'> = {
  planned: 'primary',
  ongoing: 'success',
  completed: 'neutral',
};

export default function TripListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const user = useAppSelector((s) => s.auth.user);
  const { data: trips, isLoading, isError, refetch } = useGetTripsQuery(user?.id ?? '', { skip: !user });

  if (isLoading) return <LoadingView label="Loading your trips..." />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="No trips yet"
            subtitle="Create your first trip or let the AI Travel Planner build one for you."
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}>
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{item.title}</Text>
                <Badge label={item.status} tone={statusTone[item.status] ?? 'neutral'} />
              </View>
              <Text style={styles.meta}>{item.destination}</Text>
              <Text style={styles.meta}>
                {item.startDate} → {item.endDate}
              </Text>
              <Text style={styles.budget}>Budget: ${item.budgetUsd}</Text>
            </Card>
          </Pressable>
        )}
      />
      <Pressable style={styles.fab} onPress={() => navigation.navigate('TripForm', undefined)}>
        <Ionicons name="add" size={26} color={colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  card: { marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  title: { ...typography.h3, color: colors.text, flexShrink: 1 },
  meta: { ...typography.caption, color: colors.textMuted },
  budget: { ...typography.label, color: colors.primaryDark, marginTop: spacing.xs },
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
