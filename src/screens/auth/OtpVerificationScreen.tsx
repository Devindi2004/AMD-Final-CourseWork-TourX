import { useRoute, type RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useResendVerificationMutation, useVerifyEmailMutation } from '../../services/apiSlice';
import { sessionSet } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { saveTokens } from '../../utils/authStorage';

export default function OtpVerificationScreen() {
  const { params } = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>();
  const dispatch = useAppDispatch();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendVerification, { isLoading: resending }] = useResendVerificationMutation();

  const handleVerify = async () => {
    setError(null);
    if (code.length !== 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }
    try {
      const session = await verifyEmail({ email: params.email, code }).unwrap();
      await saveTokens(session);
      dispatch(sessionSet(session));
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid or expired code.');
    }
  };

  const handleResend = async () => {
    setError(null);
    setResent(false);
    await resendVerification({ email: params.email }).unwrap();
    setResent(true);
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.email}>{params.email}</Text>
        </Text>
      </View>

      <TextField
        label="Verification code"
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="123456"
        style={styles.codeInput}
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {resent ? <Text style={styles.successText}>A new code has been sent.</Text> : null}

      <Button label="Verify" onPress={handleVerify} loading={isLoading} />
      <Button
        label="Resend code"
        variant="outline"
        onPress={handleResend}
        loading={resending}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.lg, alignItems: 'center' },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  email: { fontWeight: '700', color: colors.text },
  codeInput: { fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  errorText: { color: colors.danger, marginBottom: spacing.sm },
  successText: { color: colors.success, marginBottom: spacing.sm },
});
