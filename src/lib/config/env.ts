export const env = {
  firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  firebaseStorageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  firebaseMessagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  firebaseAppId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  firebaseMeasurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "",
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const hasApiConfig = Boolean(env.apiBaseUrl);