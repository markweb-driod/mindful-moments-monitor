import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously as firebaseSignInAnonymously,
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/integrations/firebase/client";

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
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
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
      await firebaseSignInAnonymously(firebaseAuth);
    },
    async signInWithEmail(email, password) {
      await firebaseSignInWithEmailAndPassword(firebaseAuth, email, password);
    },
    async signUpWithEmail(email, password) {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    },
    async signOut() {
      await firebaseSignOut(firebaseAuth);
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
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Not signed in");
  return user.getIdToken();
}
