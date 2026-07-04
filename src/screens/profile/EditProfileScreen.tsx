import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Button from '../../components/Button';
import ChipSelector from '../../components/ChipSelector';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { ProfileStackParamList } from '../../navigation/types';
import { useUpdateMeMutation } from '../../services/apiSlice';
import { userUpdated } from '../../store/authSlice';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { LANGUAGE_OPTIONS } from '../../types';

const INTEREST_OPTIONS = ['Historical Landmark', 'Religious Site', 'Scenic Landmark', 'Wildlife', 'Beach'];

export default function EditProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [homeCountry, setHomeCountry] = useState(user?.homeCountry ?? '');
  const [language, setLanguage] = useState(user?.language ?? 'en');
  const [interests, setInterests] = useState<string[]>(user?.preferences.interests ?? []);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handlePhotoUploaded = async (avatarUrl: string) => {
    const updated = await updateMe({ avatarUrl }).unwrap();
    dispatch(userUpdated(updated));
  };

  const handleSave = async () => {
    setError(null);
    try {
      const updated = await updateMe({
        name,
        phone,
        homeCountry,
        language,
        preferences: { ...user?.preferences, interests, budgetTier: user?.preferences.budgetTier ?? 'mid' },
      }).unwrap();
      dispatch(userUpdated(updated));
      navigation.goBack();
    } catch (err: any) {
      setError(err?.data?.message || 'Could not save your profile.');
    }
  };

  return (
    <ScreenContainer>
      <ProfilePictureUpload avatarUrl={user?.avatarUrl ?? null} name={user?.name ?? ''} onUploaded={handlePhotoUploaded} />

      <TextField label="Full name" value={name} onChangeText={setName} style={{ marginTop: spacing.lg }} />
      <TextField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+94 71 234 5678" />
      <TextField label="Home country" value={homeCountry} onChangeText={setHomeCountry} placeholder="Sri Lanka" />

      <Text style={styles.label}>Preferred language</Text>
      <ChipSelector
        options={LANGUAGE_OPTIONS.map((l) => l.label)}
        selected={[LANGUAGE_OPTIONS.find((l) => l.code === language)?.label ?? 'English']}
        onToggle={(label) => setLanguage(LANGUAGE_OPTIONS.find((l) => l.label === label)?.code ?? 'en')}
      />

      <Text style={[styles.label, { marginTop: spacing.md }]}>Interests</Text>
      <ChipSelector options={INTEREST_OPTIONS} selected={interests} onToggle={toggleInterest} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button label="Save changes" onPress={handleSave} loading={isLoading} style={{ marginTop: spacing.lg }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  errorText: { color: colors.danger, marginTop: spacing.sm },
});
