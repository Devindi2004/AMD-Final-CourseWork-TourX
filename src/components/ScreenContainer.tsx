import React from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export default function ScreenContainer({
  children,
  scroll = true,
  style,
  padded = true,
}: ScreenContainerProps) {
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Wrapper
        style={styles.flexFill}
        contentContainerStyle={[padded && styles.padded, style] as StyleProp<ViewStyle>}
        {...(scroll ? { keyboardShouldPersistTaps: 'handled' as const } : {})}
      >
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flexFill: { flex: 1 },
  padded: { padding: spacing.md, paddingBottom: spacing.xxl },
});
