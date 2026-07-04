import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export function useCurrentLocation(auto = true) {
  const [state, setState] = useState<LocationState>({
    coords: null,
    loading: auto,
    error: null,
    permissionDenied: false,
  });

  const request = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({ coords: null, loading: false, error: 'Location permission denied', permissionDenied: true });
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setState({
        coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        loading: false,
        error: null,
        permissionDenied: false,
      });
    } catch (err: any) {
      setState({ coords: null, loading: false, error: err?.message ?? 'Unable to fetch location', permissionDenied: false });
    }
  }, []);

  useEffect(() => {
    if (auto) request();
  }, [auto, request]);

  return { ...state, refresh: request };
}
