import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useRecognizeLandmarkMutation } from '../../services/aiApi';

export default function LandmarkRecognitionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [recognize, { data: result, isLoading, reset }] = useRecognizeLandmarkMutation();

  const runRecognition = async (imageBase64?: string) => {
    if (!imageBase64) return;
    await recognize({ imageBase64 }).unwrap().catch(() => undefined);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.3 });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      runRecognition(res.assets[0].base64 ?? undefined);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.3 });
    if (!res.canceled && res.assets[0]) {
      setPhotoUri(res.assets[0].uri);
      runRecognition(res.assets[0].base64 ?? undefined);
    }
  };

  const reload = () => {
    setPhotoUri(null);
    reset();
  };

  return (
    <ScreenContainer>
      <Text style={styles.title}>AI Landmark Recognition</Text>
      <Text style={styles.subtitle}>
        Take or choose a photo of a landmark. Simulates the proposal's cloud computer-vision API
        with deterministic offline matching over the POI dataset.
      </Text>

      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={36} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button label="Take photo" onPress={takePhoto} style={{ flex: 1 }} />
        <Button label="Choose photo" variant="outline" onPress={pickPhoto} style={{ flex: 1 }} />
      </View>

      {isLoading ? <LoadingView label="Identifying landmark..." /> : null}

      {result ? (
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultName}>{result.landmark.name}</Text>
            <Badge label={`${Math.round(result.matchConfidence * 100)}% match`} tone="primary" />
          </View>
          <Text style={styles.resultMeta}>{result.landmark.city} · {result.landmark.category}</Text>
          <Text style={styles.resultDescription}>{result.landmark.description}</Text>

          <View style={styles.buttonRow}>
            <Button
              label="Read aloud"
              variant="outline"
              icon={<Ionicons name="volume-high" size={16} color={colors.primary} />}
              onPress={() => Speech.speak(`${result.landmark.name}. ${result.landmark.description}`)}
              style={{ flex: 1 }}
            />
            <Button
              label="View details"
              onPress={() => navigation.navigate('PoiDetail', { poiId: result.landmark.id })}
              style={{ flex: 1 }}
            />
          </View>
          <Pressable onPress={reload}>
            <Text style={styles.retryText}>Scan another landmark</Text>
          </Pressable>
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginVertical: spacing.sm },
  photo: { width: '100%', height: 220, borderRadius: radius.md, marginBottom: spacing.md },
  placeholder: { width: '100%', height: 220, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  buttonRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultName: { ...typography.h3, color: colors.text, flexShrink: 1 },
  resultMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  resultDescription: { ...typography.body, color: colors.text, marginTop: spacing.sm },
  retryText: { ...typography.caption, color: colors.primary, textAlign: 'center', marginTop: spacing.md },
});
