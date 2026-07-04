import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Badge, { crowdTone } from '../../components/Badge';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetPoisQuery, useGetReviewsQuery } from '../../services/catalogApi';
import { useGetCrowdPredictionQuery } from '../../services/miscApi';

export default function PoiDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'PoiDetail'>>();
  const { data: pois, isLoading } = useGetPoisQuery();
  const { data: crowd } = useGetCrowdPredictionQuery(params.poiId);
  const { data: reviews } = useGetReviewsQuery({ targetType: 'poi', targetId: params.poiId });
  const [speaking, setSpeaking] = useState(false);

  const poi = pois?.find((p) => p.id === params.poiId);

  if (isLoading || !poi) return <LoadingView label="Loading landmark..." />;

  const speak = () => {
    setSpeaking(true);
    Speech.speak(`${poi.name}. ${poi.description}`, {
      language: 'en',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const stop = () => {
    Speech.stop();
    setSpeaking(false);
  };

  return (
    <ScreenContainer>
      <Text style={styles.name}>{poi.name}</Text>
      <Text style={styles.meta}>{poi.city} · {poi.category}</Text>

      {crowd ? (
        <View style={{ marginTop: spacing.xs, marginBottom: spacing.sm }}>
          <Badge label={`${crowd.level} crowd right now`} tone={crowdTone(crowd.level)} />
        </View>
      ) : null}

      <Card style={{ marginTop: spacing.sm }}>
        <Text style={styles.description}>{poi.description}</Text>
      </Card>

      <View style={styles.actionRow}>
        <Button
          label={speaking ? 'Stop narration' : 'AI Voice Guide'}
          variant={speaking ? 'danger' : 'outline'}
          onPress={speaking ? stop : speak}
          icon={<Ionicons name={speaking ? 'stop' : 'volume-high'} size={16} color={speaking ? colors.textInverse : colors.primary} />}
          style={styles.actionButton}
        />
        <Button
          label="AR Navigate"
          variant="outline"
          onPress={() => navigation.navigate('ArNavigation', { poiId: poi.id })}
          icon={<Ionicons name="navigate" size={16} color={colors.primary} />}
          style={styles.actionButton}
        />
      </View>

      <Button
        label="Write a review"
        variant="outline"
        onPress={() => navigation.navigate('ReviewComposer', { targetType: 'poi', targetId: poi.id, targetName: poi.name })}
        style={{ marginTop: spacing.sm }}
      />

      <Text style={styles.sectionTitle}>Reviews ({reviews?.length ?? 0})</Text>
      {(reviews ?? []).length === 0 ? (
        <Text style={styles.description}>No reviews yet — be the first!</Text>
      ) : (
        reviews!.map((r) => (
          <Card key={r.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: 2 }}>
              {Array.from({ length: r.rating }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color={colors.secondary} />
              ))}
            </View>
            <Text style={styles.description}>{r.comment}</Text>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  name: { ...typography.h2, color: colors.text },
  meta: { ...typography.body, color: colors.textMuted, marginTop: 2 },
  description: { ...typography.body, color: colors.text },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionButton: { flex: 1 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
});
