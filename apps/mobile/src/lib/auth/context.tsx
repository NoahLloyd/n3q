import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { Profile } from "@n3q/shared";
import { supabase } from "../supabase/client";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  authenticate: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  profile: null,
  signOut: async () => {},
  authenticate: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const token = await SecureStore.getItemAsync("n3q_access_token");
      const storedUserId = await SecureStore.getItemAsync("n3q_user_id");

      if (token && storedUserId) {
        setUserId(storedUserId);
        setIsAuthenticated(true);
        await fetchProfile(storedUserId);
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  }

  async function authenticate(accessToken: string, refreshToken: string) {
    // Store tokens securely
    await SecureStore.setItemAsync("n3q_access_token", accessToken);
    await SecureStore.setItemAsync("n3q_refresh_token", refreshToken);

    // Decode the user ID from the token payload
    // The token is a JWT — extract the sub claim
    const payload = JSON.parse(atob(accessToken.split(".")[1]));
    const uid = payload.sub;

    await SecureStore.setItemAsync("n3q_user_id", uid);
    setUserId(uid);
    setIsAuthenticated(true);
    await fetchProfile(uid);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync("n3q_access_token");
    await SecureStore.deleteItemAsync("n3q_refresh_token");
    await SecureStore.deleteItemAsync("n3q_user_id");
    setIsAuthenticated(false);
    setUserId(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        userId,
        profile,
        signOut,
        authenticate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
