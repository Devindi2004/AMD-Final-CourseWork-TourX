import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Badge, { crowdTone } from '../../components/Badge';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import type { ExploreStackParamList } from '../../navigation/types';
import { useGetPoisQuery } from '../../services/catalogApi';
import { useGetCrowdPredictionQuery } from '../../services/miscApi';
import type { PointOfInterest } from '../../types';

function CrowdRow({ poi, onPress }: { poi: PointOfInterest; onPress: () => void }) {
  const { data: crowd } = useGetCrowdPredictionQuery(poi.id);
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{poi.name}</Text>
          <Text style={styles.city}>{poi.city}</Text>
        </View>
        {crowd ? <Badge label={crowd.level} tone={crowdTone(crowd.level)} /> : <Text style={styles.loading}>...</Text>}
      </Card>
    </Pressable>
  );
}

export default function CrowdPredictionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ExploreStackParamList>>();
  const { data: pois, isLoading } = useGetPoisQuery();

  if (isLoading) return <LoadingView label="Loading attractions..." />;

  return (
    <ScreenContainer>
      <Text style={styles.subtitle}>
        Live-estimated crowd levels based on time of day and typical visitation patterns.
      </Text>
      {(pois ?? []).map((poi) => (
        <CrowdRow key={poi.id} poi={poi} onPress={() => navigation.navigate('PoiDetail', { poiId: poi.id })} />
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  name: { ...typography.label, color: colors.text },
  city: { ...typography.caption, color: colors.textMuted },
  loading: { ...typography.caption, color: colors.textMuted },
});
