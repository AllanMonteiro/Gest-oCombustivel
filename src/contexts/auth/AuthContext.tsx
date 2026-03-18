import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { hasApiConfig, hasSupabaseConfig } from "@/lib/config/env";
import { supabaseClient } from "@/services/firebase/client";

export type AppRole = "admin" | "operador" | "gestor";

export interface AuthProfile {
  id: string;
  nome: string;
  email: string;
  role: AppRole;
}

interface AuthContextValue {
  status: "loading" | "authenticated" | "unauthenticated";
  isAuthenticated: boolean;
  isSupabaseConfigured: boolean;
  isApiConfigured: boolean;
  profile: AuthProfile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function buildProfile(session: Session | null): AuthProfile | null {
  const user = session?.user;
  if (!user || !user.email) return null;
  const metadata = user.user_metadata ?? {};
  const role = metadata.role === "admin" || metadata.role === "gestor" ? metadata.role : "operador";

  return {
    id: user.id,
    email: user.email,
    nome: typeof metadata.nome === "string" && metadata.nome.trim() ? metadata.nome.trim() : user.email.split("@")[0],
    role,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthContextValue["status"]>(hasSupabaseConfig ? "loading" : "unauthenticated");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabaseClient) {
      setStatus("unauthenticated");
      return;
    }

    let mounted = true;

    supabaseClient.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    });

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setStatus(nextSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const profile = useMemo(() => buildProfile(session), [session]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    isAuthenticated: status === "authenticated",
    isSupabaseConfigured: hasSupabaseConfig,
    isApiConfigured: hasApiConfig,
    profile,
    session,
    signIn: async (email, password) => {
      if (!supabaseClient) throw new Error("Supabase nao configurado.");
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signOut: async () => {
      if (!supabaseClient) return;
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    },
  }), [profile, session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}