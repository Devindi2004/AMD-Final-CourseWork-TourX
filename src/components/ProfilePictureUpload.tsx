import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { useGetUploadSignatureMutation } from '../services/apiSlice';
import { uploadImageToCloudinary } from '../utils/cloudinaryUpload';

interface ProfilePictureUploadProps {
  avatarUrl: string | null;
  name: string;
  onUploaded: (url: string) => void;
}

export default function ProfilePictureUpload({ avatarUrl, name, onUploaded }: ProfilePictureUploadProps) {
  const [getUploadSignature] = useGetUploadSignatureMutation();
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true, aspect: [1, 1] })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          allowsEditing: true,
          aspect: [1, 1],
        });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const signature = await getUploadSignature().unwrap();
      const secureUrl = await uploadImageToCloudinary(result.assets[0].uri, signature);
      onUploaded(secureUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.data?.message || err?.message || 'Could not upload your photo.');
    } finally {
      setUploading(false);
    }
  };

  const handlePress = () => {
    Alert.alert('Update profile photo', undefined, [
      { text: 'Take photo', onPress: () => pickAndUpload(true) },
      { text: 'Choose from library', onPress: () => pickAndUpload(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <Pressable onPress={handlePress} disabled={uploading} style={styles.wrapper}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}>
          <Text style={styles.placeholderText}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      )}
      <View style={styles.badge}>
        {uploading ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Ionicons name="camera" size={16} color={colors.textInverse} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: 84, height: 84, alignSelf: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42 },
  placeholder: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.textInverse, fontSize: 32, fontWeight: '700' },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
});
