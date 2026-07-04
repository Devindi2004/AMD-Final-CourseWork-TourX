import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useResetPasswordMutation } from '../../services/apiSlice';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const [code, setCode] = useState('');
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
  errorText: { color: colors.danger, marginBottom: spacing.sm },
  successText: { color: colors.success, marginBottom: spacing.sm },
});
