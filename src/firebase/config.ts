import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// import.meta.env is injected by Vite in the app build; under plain Node
// (tests, scripts) fall back to process.env so the same module works with
// the Firebase emulators.
const env = (import.meta as unknown as { env?: Record<string, string> }).env ??
  ((globalThis as { process?: { env?: Record<string, string> } }).process?.env ?? {});

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
