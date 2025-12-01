"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useMembership } from "@/lib/web3/hooks";
import { getOrCreateProfile } from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import { Sidebar } from "./sidebar";

interface AppLayoutClientProps {
  children: ReactNode;
}

export function AppLayoutClient({ children }: AppLayoutClientProps) {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { isMember, isLoading, tokenId } = useMembership();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }

    if (!isLoading && !isMember) {
      router.push("/");
    }
  }, [isConnected, isMember, isLoading, router]);

  // Fetch or create profile when connected
  useEffect(() => {
    if (address && isMember) {
      getOrCreateProfile(address).then(setProfile);
    }
  }, [address, isMember]);

  // Listen for profile updates (from profile page edits)
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (address) {
        getOrCreateProfile(address).then(setProfile);
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [address]);

  if (!isConnected || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Verifying membership...
          </p>
        </div>
      </div>
    );
  }

  if (!isMember) {
    return null;
  }

  // Use profile display name if set, otherwise truncated wallet address
  const displayName =
    profile?.display_name ||
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Member");

  // Generate initials from display name or use default
  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "N3";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        displayName={displayName}
        avatarUrl={profile?.avatar_url || undefined}
        initials={initials}
        walletAddress={address}
        tokenId={tokenId}
      />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
