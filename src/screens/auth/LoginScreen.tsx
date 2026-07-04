import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import GoogleLoginButton from '../../components/GoogleLoginButton';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useLoginMutation } from '../../services/apiSlice';
import { sessionSet } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { saveTokens } from '../../utils/authStorage';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('demo@tourx.app');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    try {
      const session = await login({ email: email.trim(), password }).unwrap();
      await saveTokens(session);
      dispatch(sessionSet(session));
    } catch (err: any) {
      if (err?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigation.navigate('OtpVerification', { email: err.data.email || email.trim() });
        return;
      }
      setError(err?.data?.message || 'Unable to sign in. Check your credentials.');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.brandRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>TX</Text>
        </View>
        <Text style={styles.title}>TourX</Text>
        <Text style={styles.subtitle}>Your AI-powered Sri Lanka travel companion</Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="••••••••"
      />

      <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: spacing.md }}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Sign In" onPress={handleLogin} loading={isLoading} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <GoogleLoginButton onError={setError} />

      <Text style={styles.demoHint}>Demo account pre-filled: demo@tourx.app / Passw0rd!</Text>

      <Button
        label="Create an account"
        variant="outline"
        onPress={() => navigation.navigate('Register')}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandRow: { alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xl },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  logoText: { color: colors.textInverse, fontWeight: '800', fontSize: 22 },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  errorText: { color: colors.danger, marginBottom: spacing.sm },
  link: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.md, gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerText: { ...typography.caption, color: colors.textMuted },
  demoHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md },
});
