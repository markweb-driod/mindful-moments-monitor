import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parseServiceAccountJson(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resolveServiceAccount() {
  const rawJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJson) {
    const parsed = parseServiceAccountJson(rawJson);
    if (parsed) return parsed;
  }

  const rawBase64 =
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_BASE64?.trim();
  if (rawBase64) {
    const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
    const parsed = parseServiceAccountJson(decoded);
    if (parsed) return parsed;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (!projectId || !clientEmail || !privateKey) return null;
  return {
    projectId,
    clientEmail,
    privateKey,
  };
}

function getOrInitFirebaseAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount) return null;

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID?.trim() || serviceAccount.projectId,
  });
}

export function getFirebaseAdminAuth() {
  const app = getOrInitFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirestoreAdmin() {
  const app = getOrInitFirebaseAdminApp();
  if (!app) return null;
  return getFirestore(app);
}
