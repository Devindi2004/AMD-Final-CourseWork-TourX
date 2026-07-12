import { apiSlice } from './apiSlice';
import type { CrowdPrediction, TransportRoute, WeatherResponse } from '../types';

export const miscApi = apiSlice.injectEndpoints({
  overrideExisting: __DEV__,
  endpoints: (builder) => ({
    getCrowdPrediction: builder.query<CrowdPrediction, string>({
      query: (poiId) => `/crowd/${poiId}`,
    }),
    getTransportRoutes: builder.query<TransportRoute[], { from?: string; to?: string } | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.from) params.set('from', filters.from);
        if (filters?.to) params.set('to', filters.to);
        const qs = params.toString();
        return `/transport/routes${qs ? `?${qs}` : ''}`;
      },
    }),
    getWeather: builder.query<WeatherResponse, { lat: number; lon: number; city: string }>({
      query: ({ lat, lon, city }) => `/weather?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`,
    }),
  }),
});

export const { useGetCrowdPredictionQuery, useGetTransportRoutesQuery, useGetWeatherQuery } =
  miscApi;
