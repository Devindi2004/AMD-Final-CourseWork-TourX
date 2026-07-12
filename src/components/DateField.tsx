import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

interface DateFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // YYYY-MM-DD, days before this are disabled
  placeholder?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function parseISODate(value: string): Date {
  if (!value) return new Date();
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

export default function DateField({ label, value, onChange, minDate, placeholder }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => parseISODate(value || minDate || ''));

  const openPicker = () => {
    setCursor(parseISODate(value || minDate || ''));
    setOpen(true);
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const minD = minDate ? parseISODate(minDate) : null;

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const selectDay = (day: number) => {
    onChange(toISODate(year, month, day));
    setOpen(false);
  };

  const changeMonth = (delta: number) => setCursor(new Date(year, month + delta, 1));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={openPicker}>
        <Text style={value ? styles.valueText : styles.placeholderText}>{value || placeholder || 'Select date'}</Text>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => changeMonth(-1)} hitSlop={8}>
                <Ionicons name="chevron-back" size={20} color={colors.text} />
              </Pressable>
              <Text style={styles.calendarTitle}>{MONTH_NAMES[month]} {year}</Text>
              <Pressable onPress={() => changeMonth(1)} hitSlop={8}>
                <Ionicons name="chevron-forward" size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAY_LABELS.map((w, i) => (
                <Text key={i} style={styles.weekLabel}>{w}</Text>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((day, idx) => {
                if (day === null) return <View key={idx} style={styles.dayCell} />;
                const iso = toISODate(year, month, day);
                const isSelected = iso === value;
                const isDisabled = !!minD && new Date(year, month, day) < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate());
                return (
                  <Pressable
                    key={idx}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                    disabled={isDisabled}
                    onPress={() => selectDay(day)}
                  >
                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected, isDisabled && styles.dayTextDisabled]}>
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    backgroundColor: colors.surface,
  },
  valueText: { fontSize: 15, color: colors.text },
  placeholderText: { fontSize: 15, color: colors.textMuted },
  backdrop: { flex: 1, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center' },
  calendarCard: { width: 320, maxWidth: '90%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  calendarTitle: { ...typography.label, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', ...typography.caption, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCellSelected: { backgroundColor: colors.primary, borderRadius: radius.pill },
  dayText: { ...typography.body, color: colors.text },
  dayTextSelected: { color: colors.textInverse, fontWeight: '700' },
  dayTextDisabled: { color: colors.border },
});
