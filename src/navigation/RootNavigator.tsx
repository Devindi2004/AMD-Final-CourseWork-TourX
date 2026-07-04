import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { apiSlice } from '../services/apiSlice';
import { bootstrapFinished, loggedOut, tokensLoaded, userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearTokens, readTokens } from '../utils/authStorage';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { accessToken, bootstrapped } = useAppSelector((s) => s.auth);

  useEffect(() => {
    (async () => {
      const stored = await readTokens();
      if (!stored) {
        dispatch(bootstrapFinished());
        return;
      }
      // Seed the store with the persisted tokens first: baseQueryWithReauth reads
      // the access token from state, and will transparently refresh it via the
      // stored refresh token if it has already expired since the last session.
      dispatch(tokensLoaded(stored));
      try {
        const user = await dispatch(apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
          .unwrap();
        dispatch(userUpdated(user));
      } catch {
        await clearTokens();
        dispatch(loggedOut());
      } finally {
        dispatch(bootstrapFinished());
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!bootstrapped) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <NavigationContainer>{accessToken ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
