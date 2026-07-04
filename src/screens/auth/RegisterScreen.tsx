import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { AuthStackParamList } from '../../navigation/types';
import { useRegisterMutation } from '../../services/apiSlice';
import { credentialsSet } from '../../store/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { saveToken } from '../../utils/authStorage';

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [homeCountry, setHomeCountry] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setError(null);
    if (!name || !email || !password) {
      setError('Name, email, and password are required.');
      return;
    }
    try {
      const result = await register({ name, email: email.trim(), password, homeCountry }).unwrap();
      await saveToken(result.accessToken);
      dispatch(credentialsSet({ token: result.accessToken, user: result.user }));
    } catch (err: any) {
      setError(err?.data?.message || 'Unable to create your account.');
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
        placeholder="At least 6 characters"
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Sign Up" onPress={handleRegister} loading={isLoading} style={{ marginTop: spacing.sm }} />
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
  errorText: { color: colors.danger, marginBottom: spacing.sm },
});
