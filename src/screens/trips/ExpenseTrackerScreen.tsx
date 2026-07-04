import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { TripsStackParamList } from '../../navigation/types';
import { useGetTripQuery } from '../../services/tripsApi';
import { useCreateExpenseMutation, useDeleteExpenseMutation, useGetExpensesQuery } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';

const CATEGORIES = ['Accommodation', 'Food', 'Transport', 'Activities', 'Shopping', 'Other'];

export default function ExpenseTrackerScreen() {
  const { params } = useRoute<RouteProp<TripsStackParamList, 'ExpenseTracker'>>();
  const { tripId } = params;
  const user = useAppSelector((s) => s.auth.user);

  const { data: trip } = useGetTripQuery(tripId);
  const { data: expenses, isLoading } = useGetExpensesQuery({ tripId });
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const total = useMemo(() => (expenses ?? []).reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const budget = trip?.budgetUsd ?? 0;
  const pct = budget > 0 ? Math.min(1, total / budget) : 0;
  const overBudget = budget > 0 && total > budget;

  const handleAdd = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    await createExpense({
      tripId,
      userId: user?.id,
      category,
      amount: value,
      currency: 'USD',
      note,
      date: new Date().toISOString().slice(0, 10),
    }).unwrap();
    setAmount('');
    setNote('');
  };

  if (isLoading) return <LoadingView label="Loading expenses..." />;

  return (
    <ScreenContainer>
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Spent ${total.toFixed(2)} of ${budget}</Text>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct * 100}%`, backgroundColor: overBudget ? colors.danger : colors.success },
            ]}
          />
        </View>
        {overBudget ? <Text style={styles.overBudgetText}>You're over budget for this trip.</Text> : null}
      </Card>

      <Text style={styles.sectionTitle}>Add expense</Text>
      <ChipSelector options={CATEGORIES} selected={[category]} onToggle={setCategory} />
      <TextField label="Amount (USD)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="25" />
      <TextField label="Note" value={note} onChangeText={setNote} placeholder="Tuk-tuk to the fort" />
      <Button label="Add expense" onPress={handleAdd} loading={creating} />

      <Text style={styles.sectionTitle}>History</Text>
      {(expenses ?? []).length === 0 ? (
        <Text style={styles.muted}>No expenses logged yet.</Text>
      ) : (
        (expenses ?? [])
          .slice()
          .sort((a, b) => (a.date < b.date ? 1 : -1))
          .map((e) => (
            <Card key={e.id} style={styles.expenseRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseCategory}>{e.category}</Text>
                {e.note ? <Text style={styles.expenseNote}>{e.note}</Text> : null}
                <Text style={styles.expenseDate}>{e.date}</Text>
              </View>
              <Text style={styles.expenseAmount}>${e.amount.toFixed(2)}</Text>
              <Pressable onPress={() => deleteExpense(e.id)} style={{ marginLeft: spacing.sm }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
            </Card>
          ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryCard: { marginBottom: spacing.lg },
  summaryLabel: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%' },
  overBudgetText: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  muted: { ...typography.body, color: colors.textMuted },
  expenseRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  expenseCategory: { ...typography.label, color: colors.text },
  expenseNote: { ...typography.caption, color: colors.textMuted },
  expenseDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  expenseAmount: { ...typography.body, color: colors.primaryDark, fontWeight: '700' },
});
