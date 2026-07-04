import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import ScreenContainer from '../../components/ScreenContainer';
import { colors, radius, spacing, typography } from '../../constants/theme';
import type { HomeStackParamList } from '../../navigation/types';
import { useGetTripsQuery } from '../../services/tripsApi';
import { useGetNotificationsQuery } from '../../services/personalApi';
import { useAppSelector } from '../../store/hooks';

const QUICK_ACTIONS: {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tab: string;
  screen: string;
}[] = [
  { key: 'scan-landmark', label: 'Scan Landmark', icon: 'camera', tab: 'ExploreTab', screen: 'LandmarkRecognition' },
  { key: 'scan-qr', label: 'Scan QR', icon: 'qr-code', tab: 'ExploreTab', screen: 'QrScanner' },
  { key: 'ar-nav', label: 'AR Navigate', icon: 'navigate', tab: 'ExploreTab', screen: 'ArNavigation' },
  { key: 'sos', label: 'Emergency SOS', icon: 'alert-circle', tab: 'SafetyTab', screen: 'SafetyHome' },
];

export default function HomeDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  // Cross-tab navigation intentionally uses an untyped parent ref: quick actions jump
  // into sibling tab stacks, which react-navigation supports via the parent navigator.
  const rootNavigation = navigation.getParent<any>();
  const user = useAppSelector((s) => s.auth.user);

  const { data: trips } = useGetTripsQuery(user?.id ?? '', { skip: !user });
  const { data: notifications } = useGetNotificationsQuery(user?.id ?? '', { skip: !user });

  const upcomingTrip = trips?.find((t) => t.status !== 'completed');
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <ScreenContainer>
      <Text style={styles.greeting}>Ayubowan, {user?.name?.split(' ')[0] ?? 'Traveller'} 👋</Text>
      <Text style={styles.subGreeting}>Here's what's happening with your trip.</Text>

      <Pressable onPress={() => navigation.navigate('Weather')}>
        <Card style={styles.weatherCard}>
          <Ionicons name="partly-sunny" size={28} color={colors.secondary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.weatherTitle}>Live weather forecast</Text>
            <Text style={styles.weatherSubtitle}>Tap to see current conditions & 5-day outlook</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </Card>
      </Pressable>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickGrid}>
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            style={styles.quickTile}
            onPress={() => rootNavigation?.navigate(action.tab, { screen: action.screen })}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name={action.icon} size={22} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      {upcomingTrip ? (
        <>
          <Text style={styles.sectionTitle}>Upcoming trip</Text>
          <Pressable
            onPress={() => rootNavigation?.navigate('TripsTab', { screen: 'TripDetail', params: { tripId: upcomingTrip.id } })}
          >
            <Card>
              <Text style={styles.tripTitle}>{upcomingTrip.title}</Text>
              <Text style={styles.tripMeta}>
                {upcomingTrip.destination} · {upcomingTrip.startDate} → {upcomingTrip.endDate}
              </Text>
            </Card>
          </Pressable>
        </>
      ) : null}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        {unreadCount > 0 ? <Text style={styles.unreadPill}>{unreadCount} new</Text> : null}
      </View>
      {notifications && notifications.length > 0 ? (
        notifications.slice(0, 4).map((n) => (
          <Card key={n.id} style={styles.notificationCard}>
            <Ionicons
              name={n.type === 'weather' ? 'rainy' : n.type === 'crowd' ? 'people' : 'notifications'}
              size={18}
              color={colors.primary}
            />
            <Text style={styles.notificationText}>{n.message}</Text>
          </Card>
        ))
      ) : (
        <Text style={styles.subGreeting}>No notifications yet.</Text>
      )}

      <Pressable onPress={() => navigation.navigate('Chatbot')} style={styles.chatbotFab}>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.textInverse} />
        <Text style={styles.chatbotFabText}>Ask TourX Assistant</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  greeting: { ...typography.h1, fontSize: 24, color: colors.text },
  subGreeting: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  weatherCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  weatherTitle: { ...typography.h3, color: colors.text },
  weatherSubtitle: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadPill: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  quickTile: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems: 'flex-start', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  quickIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E6F4F2', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  quickLabel: { ...typography.label, color: colors.text },
  tripTitle: { ...typography.h3, color: colors.text },
  tripMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  notificationCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  notificationText: { ...typography.body, color: colors.text, flex: 1, marginLeft: spacing.sm },
  chatbotFab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, borderRadius: radius.pill, paddingVertical: spacing.sm, marginTop: spacing.lg, gap: spacing.sm },
  chatbotFabText: { ...typography.label, color: colors.textInverse },
});
