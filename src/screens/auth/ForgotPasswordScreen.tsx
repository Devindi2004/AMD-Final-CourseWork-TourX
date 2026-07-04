import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useForgotPasswordMutation } from '../../services/apiSlice';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async () => {
    if (!email.trim()) return;
    await forgotPassword({ email: email.trim() }).unwrap();
    navigation.navigate('ResetPassword', { email: email.trim() });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter your account email and we'll send a 6-digit reset code.
        </Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />

      <Button label="Send reset code" onPress={handleSubmit} loading={isLoading} />
      <Button label="Back to sign in" variant="outline" onPress={() => navigation.navigate('Login')} style={{ marginTop: spacing.md }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
});
