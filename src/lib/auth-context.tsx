import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseClientAuth } from "@/integrations/firebase/client";

interface AppUser {
  id: string;
  email: string | null;
  is_anonymous: boolean;
}

interface AuthCtx {
  session: User | null;
  user: AppUser | null;
  loading: boolean;
  signInAnonymously: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function toAppUser(user: User | null): AppUser | null {
  if (!user) return null;
  return {
    id: user.uid,
    email: user.email,
    is_anonymous: user.isAnonymous,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    if (!auth) {
      // Firebase not configured in this environment — treat as unauthenticated
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      setSession(user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value: AuthCtx = {
    session,
    user: toAppUser(session),
    loading,
    async signInAnonymously() {
      const auth = getFirebaseClientAuth();
      if (!auth) throw new Error("Firebase not configured");
      await firebaseSignInAnonymously(auth);
    },
    async signInWithEmail(email, password) {
      const auth = getFirebaseClientAuth();
      if (!auth) throw new Error("Firebase not configured");
      await firebaseSignInWithEmailAndPassword(auth, email, password);
    },
    async signUpWithEmail(email, password) {
      const auth = getFirebaseClientAuth();
      if (!auth) throw new Error("Firebase not configured");
      await createUserWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      const auth = getFirebaseClientAuth();
      if (!auth) return;
      await firebaseSignOut(auth);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
}

export async function getAccessToken(): Promise<string> {
  const auth = getFirebaseClientAuth();
  const user = auth?.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
}
