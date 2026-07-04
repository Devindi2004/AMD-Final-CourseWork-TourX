import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import TextField from '../../components/TextField';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import {
  useCreateReviewMutation,
  useGetHotelsQuery,
  useGetPoisQuery,
  useGetRestaurantsQuery,
} from '../../services/catalogApi';
import { useAppSelector } from '../../store/hooks';
import type { ReviewTargetType } from '../../types';

interface Target {
  targetType: ReviewTargetType;
  targetId: string;
  targetName: string;
}

export default function ReviewComposerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { params } = useRoute<RouteProp<ExploreStackParamList, 'ReviewComposer'>>();
  const user = useAppSelector((s) => s.auth.user);
  const [createReview, { isLoading }] = useCreateReviewMutation();

  const [target, setTarget] = useState<Target | null>(
    params ? { targetType: params.targetType, targetId: params.targetId, targetName: params.targetName } : null
  );
  const [search, setSearch] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data: pois } = useGetPoisQuery(undefined, { skip: !!target });
  const { data: hotels } = useGetHotelsQuery(undefined, { skip: !!target });
  const { data: restaurants } = useGetRestaurantsQuery(undefined, { skip: !!target });

  const options: Target[] = useMemo(() => {
    if (target) return [];
    const all: Target[] = [
      ...(pois ?? []).map((p) => ({ targetType: 'poi' as const, targetId: p.id, targetName: p.name })),
      ...(hotels ?? []).map((h) => ({ targetType: 'hotel' as const, targetId: h.id, targetName: h.name })),
      ...(restaurants ?? []).map((r) => ({ targetType: 'restaurant' as const, targetId: r.id, targetName: r.name })),
    ];
    if (!search.trim()) return all;
    return all.filter((o) => o.targetName.toLowerCase().includes(search.toLowerCase()));
  }, [target, pois, hotels, restaurants, search]);

  const handleSubmit = async () => {
    if (!target || !comment.trim()) return;
    await createReview({
      userId: user?.id,
      targetType: target.targetType,
      targetId: target.targetId,
      rating,
      comment,
      photos: [],
      createdAt: new Date().toISOString(),
    }).unwrap();
    navigation.goBack();
  };

  if (!target) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>What are you reviewing?</Text>
        <TextField label="Search" value={search} onChangeText={setSearch} placeholder="Sigiriya, Galle Fort Villa..." />
        {options.slice(0, 25).map((o) => (
          <Pressable key={`${o.targetType}-${o.targetId}`} onPress={() => setTarget(o)}>
            <Card style={{ marginBottom: spacing.sm }}>
              <Text style={styles.optionName}>{o.targetName}</Text>
              <Text style={styles.optionType}>{o.targetType}</Text>
            </Card>
          </Pressable>
        ))}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>Review: {target.targetName}</Text>

      <Text style={styles.label}>Rating</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={32} color={colors.secondary} />
          </Pressable>
        ))}
      </View>

      <TextField
        label="Your review"
        value={comment}
        onChangeText={setComment}
        placeholder="Share your experience..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 100, textAlignVertical: 'top' }}
      />

      <Button label="Post review" onPress={handleSubmit} loading={isLoading} style={{ marginTop: spacing.md }} />
      {!params ? (
        <Button label="Choose a different item" variant="outline" onPress={() => setTarget(null)} style={{ marginTop: spacing.sm }} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionName: { ...typography.body, color: colors.text },
  optionType: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
});
