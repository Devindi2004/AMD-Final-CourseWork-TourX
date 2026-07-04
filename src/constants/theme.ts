export const colors = {
  primary: '#0F766E', // teal - travel/nature
  primaryDark: '#0B5750',
  secondary: '#F59E0B', // warm amber accent
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  background: '#F7FAF9',
  surface: '#FFFFFF',
  border: '#E2E8E7',
  text: '#111827',
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',
  overlay: 'rgba(15, 23, 22, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 13, fontWeight: '600' as const },
};
