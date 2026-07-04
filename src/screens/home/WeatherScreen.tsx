import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { ErrorView, LoadingView } from '../../components/StateViews';
import { colors, spacing, typography } from '../../constants/theme';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useGetWeatherQuery } from '../../services/miscApi';
import { describeWeatherCode } from '../../utils/weatherCodes';

const FALLBACK = { latitude: 7.2906, longitude: 80.6337, city: 'Kandy' };

export default function WeatherScreen() {
  const { coords, loading: locLoading } = useCurrentLocation();

  const query = useMemo(
    () => ({
      lat: coords?.latitude ?? FALLBACK.latitude,
      lon: coords?.longitude ?? FALLBACK.longitude,
      city: coords ? 'Your location' : FALLBACK.city,
    }),
    [coords]
  );

  const { data, isLoading, isError, refetch } = useGetWeatherQuery(query, { skip: locLoading });

  if (locLoading || isLoading) return <LoadingView label="Fetching live weather..." />;
  if (isError || !data) return <ErrorView message="Weather service is unreachable right now." onRetry={refetch} />;

  const current = describeWeatherCode(data.current.weather_code);

  return (
    <ScreenContainer>
      <Card style={styles.currentCard}>
        <Text style={styles.cityLabel}>{data.city}</Text>
        <Text style={styles.icon}>{current.icon}</Text>
        <Text style={styles.temp}>{Math.round(data.current.temperature_2m)}°C</Text>
        <Text style={styles.description}>{current.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Humidity {data.current.relative_humidity_2m}%</Text>
          <Text style={styles.metaText}>Wind {Math.round(data.current.wind_speed_10m)} km/h</Text>
        </View>
        <Text style={styles.source}>Live data via Open-Meteo</Text>
      </Card>

      <Text style={styles.sectionTitle}>5-day forecast</Text>
      <FlatList
        data={data.daily.time}
        keyExtractor={(item) => item}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const info = describeWeatherCode(data.daily.weather_code[index]);
          return (
            <Card style={styles.dayRow}>
              <Text style={styles.dayDate}>
                {new Date(item).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
              <Text style={styles.dayIcon}>{info.icon}</Text>
              <Text style={styles.dayTemp}>
                {Math.round(data.daily.temperature_2m_max[index])}° / {Math.round(data.daily.temperature_2m_min[index])}°
              </Text>
            </Card>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  currentCard: { alignItems: 'center', paddingVertical: spacing.lg, marginBottom: spacing.lg },
  cityLabel: { ...typography.label, color: colors.textMuted },
  icon: { fontSize: 56, marginVertical: spacing.xs },
  temp: { ...typography.h1, fontSize: 42, color: colors.text },
  description: { ...typography.body, color: colors.textMuted, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  metaText: { ...typography.caption, color: colors.textMuted },
  source: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, fontStyle: 'italic' },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayDate: { ...typography.body, color: colors.text, flex: 1 },
  dayIcon: { fontSize: 22, marginHorizontal: spacing.md },
  dayTemp: { ...typography.body, color: colors.textMuted },
});
