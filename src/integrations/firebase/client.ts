import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

function resolveFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim();
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim();

  if (!apiKey || !authDomain || !projectId || !appId) return null;

  return { apiKey, authDomain, projectId, appId, messagingSenderId, storageBucket };
}

// Lazy — only initialized in browser context (not during SSR module load)
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (_app) return _app;
  const config = resolveFirebaseConfig();
  if (!config) return null;
  _app = getApps().length ? getApp() : initializeApp(config);
  return _app;
}

export function getFirebaseClientAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

// Kept for backward-compat — safe to access; will be null on server
export const firebaseAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getFirebaseClientAuth();
    if (!auth) return undefined;
    const val = (auth as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(auth) : val;
  },
});
