import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useRegisterMutation } from '../../services/apiSlice';
import { ROLE_LABELS, SELF_REGISTERABLE_ROLES, type Role } from '../../types';

const ROLE_OPTIONS = SELF_REGISTERABLE_ROLES.map((role) => ROLE_LABELS[role]);
const roleFromLabel = (label: string): Role =>
  SELF_REGISTERABLE_ROLES.find((role) => ROLE_LABELS[role] === label) ?? 'tourist';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [register, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [password, setPassword] = useState('');
  const [roleLabel, setRoleLabel] = useState(ROLE_LABELS.tourist);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    try {
      const result = await register({
        name,
        email: email.trim(),
        password,
        role: roleFromLabel(roleLabel),
        homeCountry,
      }).unwrap();
      navigation.navigate('OtpVerification', { email: result.email, devCode: result.devVerificationCode });
    } catch (err: any) {
      if (err?.data?.errors?.length) {
        setError(err.data.errors.map((e: { message: string }) => e.message).join('\n'));
      } else {
        setError(err?.data?.message || 'Unable to create your account.');
      }
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Plan smarter, travel safer.</Text>
      </View>

      <TextField label="Full name" value={name} onChangeText={setName} placeholder="Devindi Perera" />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="you@example.com"
      />
      <TextField
        label="Home country"
        value={homeCountry}
        onChangeText={setHomeCountry}
        placeholder="Sri Lanka"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="At least 8 characters, with a letter and a number"
      />

      <Text style={styles.label}>I am a...</Text>
      <ChipSelector options={ROLE_OPTIONS} selected={[roleLabel]} onToggle={setRoleLabel} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Sign Up" onPress={handleRegister} loading={isLoading} style={{ marginTop: spacing.md }} />
      <Button
        label="Back to sign in"
        variant="outline"
        onPress={() => navigation.navigate('Login')}
        style={{ marginTop: spacing.md }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: spacing.xl, marginBottom: spacing.lg },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.xs },
  label: { ...typography.label, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  errorText: { color: colors.danger, marginTop: spacing.sm, marginBottom: spacing.sm },
});
