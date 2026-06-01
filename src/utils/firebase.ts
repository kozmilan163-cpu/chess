// Firebase Realtime DB config for multiplayer
// Using emulator for local dev, production config for deploy

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKey",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chess-app-demo.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL || "https://chess-app-demo.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chess-app-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE || "chess-app-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123",
};

// Use localStorage fallback for offline-first multiplayer when Firebase isn't available
export const useLocalStorageFallback = import.meta.env.DEV || !import.meta.env.VITE_FIREBASE_API_KEY;
