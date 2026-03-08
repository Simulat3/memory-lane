"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "../lib/types";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => void;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: () => {},
  updateProfile: async () => null,
});

const DEV_MODE = process.env.NODE_ENV === "development";

const DEV_USER = {
  id: "dev-admin-001",
  email: "admin@dev.local",
  app_metadata: {},
  user_metadata: { display_name: "JSimulat3" },
  aud: "authenticated",
  created_at: "2025-01-01T00:00:00Z",
} as unknown as User;

const DEV_PROFILE: UserProfile = {
  id: "dev-admin-001",
  email: "admin@dev.local",
  display_name: "JSimulat3",
  avatar_url: "",
  is_admin: true,
  created_at: "2025-01-01T00:00:00Z",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [devBypass, setDevBypass] = useState(false);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as UserProfile);
  }

  useEffect(() => {
    // Dev bypass: add ?dev=true to URL
    if (DEV_MODE && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("dev") === "true") {
      setUser(DEV_USER);
      setProfile(DEV_PROFILE);
      setDevBypass(true);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signUp(email: string, password: string, displayName: string): Promise<string | null> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return error.message;
    return null;
  }

  function signOut() {
    if (devBypass) {
      setUser(null);
      setProfile(null);
      setDevBypass(false);
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("dev");
        window.history.replaceState({}, "", url.toString());
      }
      return;
    }
    supabase.auth.signOut();
    setProfile(null);
  }

  async function updateProfile(updates: { display_name?: string; avatar_url?: string }): Promise<string | null> {
    // In dev bypass, just update local state
    if (devBypass) {
      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return "Not authenticated";

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const data = await res.json();
      return data.error || "Failed to update profile";
    }

    const data = await res.json();
    setProfile(data as UserProfile);
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin: profile?.is_admin ?? false, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
