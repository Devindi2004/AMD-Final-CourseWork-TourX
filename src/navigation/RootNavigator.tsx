import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/theme';
import { apiSlice } from '../services/apiSlice';
import { bootstrapFinished, loggedOut, tokenLoaded, userUpdated } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearToken, readToken } from '../utils/authStorage';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const { token, bootstrapped } = useAppSelector((s) => s.auth);

  useEffect(() => {
    (async () => {
      const stored = await readToken();
      if (!stored) {
        dispatch(bootstrapFinished());
        return;
      }
      dispatch(tokenLoaded(stored));
      try {
        const user = await dispatch(apiSlice.endpoints.getMe.initiate(undefined, { forceRefetch: true }))
          .unwrap();
        dispatch(userUpdated(user));
      } catch {
        await clearToken();
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

  return <NavigationContainer>{token ? <MainTabs /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
