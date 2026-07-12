import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ChipSelector from '../../components/ChipSelector';
import ScreenContainer from '../../components/ScreenContainer';
import { ErrorView, LoadingView } from '../../components/StateViews';
import WeatherLocationPicker, { type WeatherLocationSelection } from '../../components/WeatherLocationPicker';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { CITY_OPTIONS } from '../../constants/locations';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useGetPoisQuery } from '../../services/catalogApi';
import { useGetWeatherQuery } from '../../services/miscApi';
import { describeWeatherCode } from '../../utils/weatherCodes';

const MY_LOCATION = 'My Location';
const FALLBACK = { latitude: 7.2906, longitude: 80.6337, city: 'Kandy' };

export default function WeatherScreen() {
  const { coords, loading: locLoading, permissionDenied, refresh } = useCurrentLocation();
  const { data: pois } = useGetPoisQuery();
  const [selectedCity, setSelectedCity] = useState(MY_LOCATION);
  const [pinLocation, setPinLocation] = useState<WeatherLocationSelection | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectCity = (city: string) => {
    setPinLocation(null);
    setSelectedCity(city);
  };

  const handlePinSelected = (selection: WeatherLocationSelection) => {
    setPinLocation(selection);
  };

  // One representative coordinate per Sri Lankan city, taken from the POI dataset —
  // lets you check live weather for any destination, not just wherever you're standing.
  const cityCoords = useMemo(() => {
    const map: Record<string, { lat: number; lng: number }> = {};
    for (const poi of pois ?? []) {
      if (!map[poi.city]) map[poi.city] = { lat: poi.lat, lng: poi.lng };
    }
    return map;
  }, [pois]);

  const usingMyLocation = !pinLocation && selectedCity === MY_LOCATION;

  const query = useMemo(() => {
    if (pinLocation) {
      return { lat: pinLocation.lat, lon: pinLocation.lng, city: pinLocation.label };
    }
    if (selectedCity !== MY_LOCATION && cityCoords[selectedCity]) {
      const c = cityCoords[selectedCity];
      return { lat: c.lat, lon: c.lng, city: selectedCity };
    }
    return {
      lat: coords?.latitude ?? FALLBACK.latitude,
      lon: coords?.longitude ?? FALLBACK.longitude,
      city: coords ? 'Your location' : FALLBACK.city,
    };
  }, [pinLocation, selectedCity, cityCoords, coords]);

  const waitingForLocation = usingMyLocation && locLoading;
  const { data, isLoading, isError, refetch } = useGetWeatherQuery(query, { skip: waitingForLocation });

  return (
    <ScreenContainer>
      <ChipSelector options={[MY_LOCATION, ...CITY_OPTIONS]} selected={pinLocation ? [] : [selectedCity]} onToggle={selectCity} />

      <Pressable style={styles.pinButton} onPress={() => setPickerOpen(true)}>
        <Ionicons name="location" size={16} color={colors.primary} />
        <Text style={styles.pinButtonText}>
          {pinLocation ? `Pinned: ${pinLocation.label}` : 'Pick a location on the map'}
        </Text>
      </Pressable>
      <WeatherLocationPicker visible={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePinSelected} />

      {usingMyLocation && permissionDenied ? (
        <Pressable style={styles.permissionNotice} onPress={refresh}>
          <Ionicons name="location-outline" size={16} color={colors.warning} />
          <Text style={styles.permissionNoticeText}>
            Location access denied — showing {FALLBACK.city} weather instead. Tap to try enabling location again.
          </Text>
        </Pressable>
      ) : null}

      {waitingForLocation || isLoading ? (
        <LoadingView label="Fetching live weather..." />
      ) : isError || !data ? (
        <ErrorView message="Weather service is unreachable right now." onRetry={refetch} />
      ) : (
        <>
          <Card style={styles.currentCard}>
            <Text style={styles.cityLabel}>{data.city}</Text>
            <Text style={styles.icon}>{describeWeatherCode(data.current.weather_code).icon}</Text>
            <Text style={styles.temp}>{Math.round(data.current.temperature_2m)}°C</Text>
            <Text style={styles.description}>{describeWeatherCode(data.current.weather_code).description}</Text>
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
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginTop: spacing.sm,
  },
  pinButtonText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FEF3E2',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  permissionNoticeText: { ...typography.caption, color: colors.warning, flex: 1 },
  currentCard: { alignItems: 'center', paddingVertical: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg },
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
