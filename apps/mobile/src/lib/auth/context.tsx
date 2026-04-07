import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import type { Profile } from "@n3q/shared";
import { supabase } from "../supabase/client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  profile: Profile | null;
  signOut: () => Promise<void>;
  authenticate: (accessToken: string, refreshToken: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  devLogin: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  userId: null,
  profile: null,
  signOut: async () => {},
  authenticate: async () => {},
  getAccessToken: async () => null,
  devLogin: async () => {},
});

function decodeJwtPayload(token: string): Record<string, unknown> {
  return JSON.parse(atob(token.split(".")[1]));
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload(token);
    const exp = payload.exp as number;
    // Treat as expired if less than 2 minutes remaining
    return exp < Math.floor(Date.now() / 1000) + 120;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    try {
      const token = await SecureStore.getItemAsync("n3q_access_token");
      const storedUserId = await SecureStore.getItemAsync("n3q_user_id");

      if (token && storedUserId) {
        // If token is expired, try to refresh
        if (isTokenExpired(token)) {
          const newToken = await refreshAccessToken();
          if (!newToken) {
            // Refresh failed — clear session
            await signOut();
            return;
          }
        }

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
    await SecureStore.setItemAsync("n3q_access_token", accessToken);
    await SecureStore.setItemAsync("n3q_refresh_token", refreshToken);

    const payload = decodeJwtPayload(accessToken);
    const uid = payload.sub as string;

    await SecureStore.setItemAsync("n3q_user_id", uid);
    setUserId(uid);
    setIsAuthenticated(true);
    await fetchProfile(uid);
  }

  async function refreshAccessToken(): Promise<string | null> {
    // Deduplicate concurrent refresh calls
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const refreshToken = await SecureStore.getItemAsync("n3q_refresh_token");
        if (!refreshToken) return null;

        const res = await fetch(`${API_URL}/api/auth/mobile-refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        await SecureStore.setItemAsync("n3q_access_token", data.access_token);
        await SecureStore.setItemAsync("n3q_refresh_token", data.refresh_token);
        return data.access_token as string;
      } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync("n3q_access_token");
    if (!token) return null;

    if (isTokenExpired(token)) {
      return refreshAccessToken();
    }

    return token;
  }, []);

  async function devLogin(uid: string) {
    await SecureStore.setItemAsync("n3q_user_id", uid);
    await SecureStore.setItemAsync("n3q_access_token", "dev");
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
        getAccessToken,
        devLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
