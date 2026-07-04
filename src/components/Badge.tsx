import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

const toneColors: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#EEF2F1', fg: colors.textMuted },
  success: { bg: '#DCFCE7', fg: '#166534' },
  warning: { bg: '#FEF3C7', fg: '#92400E' },
  danger: { bg: '#FEE2E2', fg: '#991B1B' },
  primary: { bg: '#CCFBF1', fg: colors.primaryDark },
};

export default function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

export function crowdTone(level: string): Tone {
  if (level === 'High') return 'danger';
  if (level === 'Medium') return 'warning';
  return 'success';
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: { ...typography.caption, fontWeight: '700' },
});
