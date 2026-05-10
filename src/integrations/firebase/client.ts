import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

function resolveFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase client environment variables. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID."
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId,
    storageBucket,
  };
}

const firebaseApp = getApps().length ? getApp() : initializeApp(resolveFirebaseConfig());

export const firebaseAuth = getAuth(firebaseApp);
