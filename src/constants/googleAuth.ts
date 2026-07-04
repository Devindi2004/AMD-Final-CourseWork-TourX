// Google Cloud OAuth Client IDs. Populate these in a `.env` file at the project root
// (see .env.example) after creating an OAuth client at
// https://console.cloud.google.com/apis/credentials — see README > "Google OAuth setup"
// for the exact steps and an important note about Expo Go's redirect-URI limitation.
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

export const isGoogleAuthConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);
