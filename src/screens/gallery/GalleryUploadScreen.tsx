import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import SelectField from '../../components/SelectField';
import TextField from '../../components/TextField';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { PROVINCE_OPTIONS, districtsForProvince } from '../../constants/sriLankaRegions';
import { useGetUploadSignatureMutation, useUploadImageLocallyMutation } from '../../services/apiSlice';
import { useCreateGalleryItemMutation } from '../../services/galleryApi';
import { useAppSelector } from '../../store/hooks';
import { GALLERY_CATEGORIES } from '../../types';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUpload';

export default function GalleryUploadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const user = useAppSelector((s) => s.auth.user);

  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [entryFee, setEntryFee] = useState<'free' | 'paid'>('free');
  const [familyFriendly, setFamilyFriendly] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [getUploadSignature] = useGetUploadSignatureMutation();
  const [uploadImageLocally] = useUploadImageLocallyMutation();
  const [createGalleryItem] = useCreateGalleryItemMutation();

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (result.canceled || !result.assets[0]) return;
    setAsset(result.assets[0]);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) return;
      const position = await Location.getCurrentPositionAsync({});
      setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      Alert.alert('Location unavailable', 'Could not read your current location.');
    } finally {
      setLocating(false);
    }
  };

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) setTags((prev) => [...prev, clean]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    setError(null);
    if (!asset) return setError('Please select a photo.');
    if (!title.trim()) return setError('Title is required.');
    if (!category) return setError('Please choose a category.');
    if (!province) return setError('Please choose a province.');
    if (!district) return setError('Please choose a district.');

    setSubmitting(true);
    try {
      let imageUrl: string;
      try {
        const signature = await getUploadSignature().unwrap();
        imageUrl = await uploadImageToCloudinary(asset.uri, signature);
      } catch (err: any) {
        if (err?.data?.code !== 'CLOUDINARY_NOT_CONFIGURED') throw err;
        if (!asset.base64) throw new Error('Could not read the selected photo.');
        const mime = asset.mimeType ?? 'image/jpeg';
        const { url } = await uploadImageLocally({ imageBase64: `data:${mime};base64,${asset.base64}` }).unwrap();
        imageUrl = url;
      }

      await createGalleryItem({
        imageUrl,
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        province,
        district,
        photographer: user?.name ?? '',
        tags,
        entryFee,
        familyFriendly,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      }).unwrap();

      Alert.alert('Submitted', 'Your photo has been submitted and is pending admin approval.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      setError(err?.data?.message || err?.message || 'Could not submit your photo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Share a photo</Text>
      <Text style={styles.subheading}>Submissions are reviewed by an admin before appearing in the public gallery.</Text>

      <Pressable style={styles.imagePicker} onPress={pickImage}>
        {asset ? (
          <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={28} color={colors.textMuted} />
            <Text style={styles.imagePlaceholderText}>Select a photo</Text>
          </View>
        )}
      </Pressable>

      <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sigiriya Rock Fortress at Dawn" />
      <TextField label="Description" value={description} onChangeText={setDescription} placeholder="A short description" multiline numberOfLines={3} />
      <SelectField label="Category" value={category} onChange={setCategory} options={[...GALLERY_CATEGORIES]} searchable={false} />
      <SelectField label="Province" value={province} onChange={(p) => { setProvince(p); setDistrict(''); }} options={PROVINCE_OPTIONS} searchable={false} />
      <SelectField label="District" value={district} onChange={setDistrict} options={districtsForProvince(province)} placeholder={province ? 'Select...' : 'Choose a province first'} searchable={false} />

      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagInputRow}>
        <View style={{ flex: 1 }}>
          <TextField label="" value={tagInput} onChangeText={setTagInput} placeholder="e.g. Sunrise" onSubmitEditing={addTag} />
        </View>
        <Pressable style={styles.addTagButton} onPress={addTag}><Text style={styles.addTagText}>Add</Text></Pressable>
      </View>
      {tags.length > 0 ? (
        <View style={styles.tagChips}>
          {tags.map((t) => (
            <Pressable key={t} onPress={() => setTags((prev) => prev.filter((x) => x !== t))}>
              <Badge label={`#${t} ×`} tone="primary" />
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Entry fee</Text>
      <ChipSelector
        options={['Free Entry', 'Paid Entry']}
        selected={[entryFee === 'free' ? 'Free Entry' : 'Paid Entry']}
        onToggle={(l) => setEntryFee(l === 'Free Entry' ? 'free' : 'paid')}
      />

      <Text style={styles.label}>Family friendly</Text>
      <ChipSelector
        options={['Family Friendly']}
        selected={familyFriendly ? ['Family Friendly'] : []}
        onToggle={() => setFamilyFriendly((v) => !v)}
      />

      <Text style={styles.label}>GPS location</Text>
      <Pressable style={styles.locationRow} onPress={useCurrentLocation}>
        <Ionicons name="location" size={18} color={colors.primary} />
        <Text style={styles.locationText}>
          {locating ? 'Locating...' : location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Use my current location'}
        </Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Submit for review" onPress={handleSubmit} loading={submitting} style={{ marginTop: spacing.lg }} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.h2, color: colors.text },
  subheading: { ...typography.caption, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  imagePicker: { marginBottom: spacing.md },
  imagePreview: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.border },
  imagePlaceholder: {
    width: '100%', height: 160, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.surface,
  },
  imagePlaceholderText: { ...typography.caption, color: colors.textMuted },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs, marginTop: spacing.xs },
  tagInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  addTagButton: { paddingHorizontal: spacing.md, paddingVertical: 11, backgroundColor: colors.primary, borderRadius: radius.sm, marginTop: 2 },
  addTagText: { ...typography.label, color: colors.textInverse },
  tagChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md, marginTop: -spacing.sm },
  locationRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.md, backgroundColor: colors.surface,
  },
  locationText: { ...typography.body, color: colors.text },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.sm },
});
