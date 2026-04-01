"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import { useMembership } from "@/lib/web3/hooks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import type { User } from "@supabase/supabase-js";

export type AuthMethod = "wallet" | "google" | null;

interface AuthState {
  // Core identity
  userId: string | null;
  authMethod: AuthMethod;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Membership / verification
  isMember: boolean; // wallet NFT holder OR verified Google user
  isPendingVerification: boolean; // Google user awaiting approval

  // Profile
  profile: Profile | null;
  refreshProfile: () => Promise<void>;

  // Wallet-specific
  walletAddress: string | undefined;
  tokenId: number | undefined;
  isWalletConnected: boolean;

  // Google-specific
  supabaseUser: User | null;
  email: string | null;

  // Actions
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

const supabase = createSupabaseBrowserClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isConnected, isReconnecting, address } = useAccount();
  const {
    isMember: isNftMember,
    isLoading: isMembershipLoading,
    tokenId,
  } = useMembership();

  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Listen for Supabase auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSupabaseUser(user);
      setSupabaseLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ?? null);
      setSupabaseLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Determine auth method
  const authMethod: AuthMethod =
    isConnected && address
      ? "wallet"
      : supabaseUser
        ? "google"
        : null;

  const userId =
    authMethod === "wallet" ? address! : supabaseUser?.id ?? null;

  const isLoading: boolean =
    isReconnecting || supabaseLoading || (authMethod === "wallet" && !!isMembershipLoading);

  // Fetch profile for authenticated user
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
      });
  }, [userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  };

  // Membership: either NFT member or verified Google user
  const isMember =
    (authMethod === "wallet" && isNftMember) ||
    (authMethod === "google" && profile?.is_verified === true);

  const isPendingVerification =
    authMethod === "google" && profile !== null && !profile.is_verified;

  const isAuthenticated = authMethod !== null;

  const signOut = async () => {
    if (supabaseUser) {
      await supabase.auth.signOut();
    }
    // Wallet disconnect is handled by wagmi's disconnect
  };

  const value: AuthState = {
    userId,
    authMethod,
    isAuthenticated,
    isLoading,
    isMember,
    isPendingVerification,
    profile,
    refreshProfile,
    walletAddress: address,
    tokenId,
    isWalletConnected: isConnected,
    supabaseUser,
    email: supabaseUser?.email ?? profile?.email ?? null,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
