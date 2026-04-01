"use client";

import {
  createContext,
  useCallback,
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
  isMember: boolean;
  isPendingVerification: boolean;

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
  linkWallet: (address: string) => Promise<void>;
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
  const [profileLoading, setProfileLoading] = useState(false);

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

  // Determine auth method.
  // If a Supabase (Google) session exists, that's the primary auth — even if
  // a wallet is also connected. This prevents flipping to "wallet" mode when
  // a Google user connects their wallet on the profile page.
  const authMethod: AuthMethod = supabaseUser
    ? "google"
    : isConnected && address
      ? "wallet"
      : null;

  // For wallet-only users, userId = wallet address.
  // For Google users (even if wallet is also connected), userId is resolved
  // after profile lookup (could be Supabase UUID or linked wallet address).
  const rawUserId =
    authMethod === "wallet" ? address! : supabaseUser?.id ?? null;

  // The effective userId is the profile's ID (which may differ from rawUserId
  // for linked accounts where profile.id = wallet address).
  const userId = profile?.id ?? rawUserId;

  // Fetch profile for authenticated user
  useEffect(() => {
    if (!rawUserId) {
      setProfile(null);
      return;
    }

    setProfileLoading(true);

    const fetchProfile = async () => {
      // 1. Try direct lookup by ID
      const { data: byId, error: idError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", rawUserId)
        .maybeSingle();

      if (idError) {
        console.error("[AuthProvider] Error fetching profile by ID:", idError.message);
      }

      if (byId) {
        setProfile(byId);
        setProfileLoading(false);
        return;
      }

      // 2. For Google users: look up by google_user_id (linked wallet profile)
      if (authMethod === "google" && supabaseUser) {
        const { data: byGoogleId, error: googleError } = await supabase
          .from("profiles")
          .select("*")
          .eq("google_user_id", supabaseUser.id)
          .maybeSingle();

        if (googleError) {
          console.error("[AuthProvider] Error fetching profile by google_user_id:", googleError.message);
        }

        if (byGoogleId) {
          setProfile(byGoogleId);
          setProfileLoading(false);
          return;
        }

        // 3. Fallback: look up by email
        if (supabaseUser.email) {
          const { data: byEmail, error: emailError } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", supabaseUser.email)
            .maybeSingle();

          if (emailError) {
            console.error("[AuthProvider] Error fetching profile by email:", emailError.message);
          }

          if (byEmail) {
            setProfile(byEmail);
            setProfileLoading(false);
            return;
          }
        }

        // 4. No profile found at all — create one as fallback
        console.log("[AuthProvider] No profile found for Google user, creating one...");

        const displayName =
          supabaseUser.user_metadata?.full_name ||
          supabaseUser.user_metadata?.name ||
          null;
        const avatarUrl = supabaseUser.user_metadata?.avatar_url || null;

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: supabaseUser.id,
              email: supabaseUser.email,
              display_name: displayName,
              avatar_url: avatarUrl,
              auth_method: "google",
              is_verified: false,
            },
            { onConflict: "id" }
          )
          .select()
          .single();

        if (insertError) {
          console.error("[AuthProvider] Error creating profile:", insertError.message);
        }

        setProfile(newProfile ?? null);
      }

      setProfileLoading(false);
    };

    fetchProfile();
  }, [rawUserId, authMethod, supabaseUser]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    // Refresh using the profile's actual ID (handles linked accounts)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile(data);
  }, [userId]);

  const isLoading: boolean =
    isReconnecting ||
    supabaseLoading ||
    profileLoading ||
    (authMethod === "wallet" && !!isMembershipLoading);

  // Membership: NFT holder, verified Google user, or linked wallet user
  // A linked account (Google user with existing wallet profile) is always a member
  // because they were already a wallet member.
  const isLinkedAccount =
    authMethod === "google" && profile !== null && profile.id !== supabaseUser?.id;

  const isMember =
    (authMethod === "wallet" && isNftMember) ||
    (authMethod === "google" && profile?.is_verified === true) ||
    isLinkedAccount;

  const isPendingVerification =
    authMethod === "google" && !isLoading && !isMember;

  const isAuthenticated = authMethod !== null;

  const signOut = async () => {
    if (supabaseUser) {
      await supabase.auth.signOut();
    }
  };

  // Save a wallet address to the current profile
  const linkWallet = useCallback(
    async (walletAddr: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          wallet_address: walletAddr,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("[AuthProvider] Error linking wallet:", error.message);
        return;
      }

      // Refresh profile to pick up the change
      await refreshProfile();
    },
    [userId, refreshProfile]
  );

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
    linkWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
