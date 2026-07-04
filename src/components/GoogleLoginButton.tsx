import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  isGoogleAuthConfigured,
} from '../constants/googleAuth';
import { colors } from '../constants/theme';
import { useGoogleLoginMutation } from '../services/apiSlice';
import { sessionSet } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';
import { saveTokens } from '../utils/authStorage';
import Button from './Button';

WebBrowser.maybeCompleteAuthSession();

interface GoogleLoginButtonProps {
  onError?: (message: string) => void;
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const dispatch = useAppDispatch();
  const [googleLogin, { isLoading }] = useGoogleLoginMutation();
  const [exchanging, setExchanging] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.params.id_token || response.authentication?.idToken;
    if (!idToken) {
      onError?.('Google did not return an ID token.');
      return;
    }
    (async () => {
      setExchanging(true);
      try {
        const session = await googleLogin({ idToken }).unwrap();
        await saveTokens(session);
        dispatch(sessionSet(session));
      } catch (err: any) {
        onError?.(err?.data?.message || 'Google sign-in failed.');
      } finally {
        setExchanging(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  if (!isGoogleAuthConfigured) {
    return (
      <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
        Google Sign-In isn't configured yet — add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env (see README).
      </Text>
    );
  }

  return (
    <Button
      label="Continue with Google"
      variant="outline"
      disabled={!request}
      loading={isLoading || exchanging}
      onPress={() => promptAsync()}
    />
  );
}
