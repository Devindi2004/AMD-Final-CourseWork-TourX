import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useResetPasswordMutation } from '../../services/apiSlice';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const [code, setCode] = useState(params.devCode ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async () => {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword({ email: params.email, code, newPassword }).unwrap();
      setSuccess(true);
      setTimeout(() => navigation.navigate('Login'), 1200);
    } catch (err: any) {
      setError(err?.data?.message || 'Could not reset your password.');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>Enter the code sent to {params.email} and choose a new password.</Text>
      </View>

      {params.devCode ? (
        <View style={styles.devBanner}>
          <Text style={styles.devBannerText}>
            Dev mode — no real email is sent yet. Your reset code is{' '}
            <Text style={styles.devBannerCode}>{params.devCode}</Text> (already filled in below).
          </Text>
        </View>
      ) : null}

      <TextField label="Reset code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="123456" />
      <TextField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="At least 8 characters, with a letter and a number" />
      <TextField label="Confirm new password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Re-enter your new password" />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>Password reset! Redirecting to sign in...</Text> : null}

      <Button label="Reset password" onPress={handleSubmit} loading={isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  devBanner: { backgroundColor: '#FEF3C7', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.md },
  devBannerText: { ...typography.caption, color: '#92400E' },
  devBannerCode: { fontWeight: '800', letterSpacing: 1 },
  errorText: { color: colors.danger, marginBottom: spacing.sm },
  successText: { color: colors.success, marginBottom: spacing.sm },
});
