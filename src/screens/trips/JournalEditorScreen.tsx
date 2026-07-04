import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import type { TripsStackParamList } from '../../navigation/types';
import { useCreateJournalEntryMutation } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';

export default function JournalEditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TripsStackParamList>>();
  const { params } = useRoute<RouteProp<TripsStackParamList, 'JournalEditor'>>();
  const { tripId } = params;
  const user = useAppSelector((s) => s.auth.user);

  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const { coords, loading: locLoading, refresh } = useCurrentLocation(false);
  const [createEntry, { isLoading }] = useCreateJournalEntryMutation();

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !entryText.trim()) return;
    await createEntry({
      tripId,
      userId: user?.id,
      title,
      entryText,
      photos: photoUri ? [photoUri] : [],
      location: coords ? { lat: coords.latitude, lng: coords.longitude } : null,
      timestamp: new Date().toISOString(),
    }).unwrap();
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>New journal entry</Text>

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Sunrise at the fort" />
      <TextField
        label="What happened?"
        value={entryText}
        onChangeText={setEntryText}
        placeholder="Write about your day..."
        multiline
        numberOfLines={5}
        style={{ minHeight: 110, textAlignVertical: 'top' }}
      />

      <Pressable onPress={pickPhoto} style={styles.photoPicker}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={24} color={colors.textMuted} />
            <Text style={styles.photoPlaceholderText}>Add a photo</Text>
          </View>
        )}
      </Pressable>

      <Pressable onPress={refresh} style={styles.locationRow}>
        <Ionicons name="location-outline" size={18} color={colors.primary} />
        <Text style={styles.locationText}>
          {locLoading
            ? 'Tagging location...'
            : coords
            ? `Tagged: ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`
            : 'Tap to tag current location'}
        </Text>
      </Pressable>

      <Button label="Save entry" onPress={handleSave} loading={isLoading} style={{ marginTop: spacing.lg }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  photoPicker: { marginBottom: spacing.md },
  photoPreview: { width: '100%', height: 180, borderRadius: radius.md },
  photoPlaceholder: {
    height: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  photoPlaceholderText: { ...typography.caption, color: colors.textMuted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  locationText: { ...typography.caption, color: colors.textMuted },
});
