import { apiSlice } from './apiSlice';
import type {
  BudgetTier,
  ChatbotReply,
  GeneratedItinerary,
  LandmarkRecognitionResult,
  TranslationResult,
} from '../types';

export const aiApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateItinerary: builder.mutation<
      GeneratedItinerary,
      { destination: string; days: number; budgetTier: BudgetTier; interests: string[] }
    >({
      query: (body) => ({ url: '/ai/itinerary', method: 'POST', body }),
    }),
    recognizeLandmark: builder.mutation<
      LandmarkRecognitionResult,
      { imageBase64?: string; hint?: string }
    >({
      query: (body) => ({ url: '/ai/landmark-recognition', method: 'POST', body }),
    }),
    askChatbot: builder.mutation<ChatbotReply, { message: string }>({
      query: (body) => ({ url: '/ai/chatbot', method: 'POST', body }),
    }),
    translateText: builder.mutation<TranslationResult, { text: string; targetLanguage: string }>({
      query: (body) => ({ url: '/ai/translate', method: 'POST', body }),
    }),
  }),
});

export const {
  useGenerateItineraryMutation,
  useRecognizeLandmarkMutation,
  useAskChatbotMutation,
  useTranslateTextMutation,
} = aiApi;
