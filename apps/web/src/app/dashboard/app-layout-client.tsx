"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { Sidebar } from "./sidebar";

interface AppLayoutClientProps {
  children: ReactNode;
}

export function AppLayoutClient({ children }: AppLayoutClientProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isMember,
    isPendingVerification,
    isLoading,
    profile,
    refreshProfile,
    walletAddress,
    tokenId,
    authMethod,
    email,
  } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (isPendingVerification) {
      router.push("/pending");
      return;
    }

    if (!isMember) {
      router.push("/");
    }
  }, [isAuthenticated, isMember, isPendingVerification, isLoading, router]);

  // Listen for profile updates (from profile page edits)
  useEffect(() => {
    const handleProfileUpdate = () => {
      refreshProfile();
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profile-updated", handleProfileUpdate);
  }, [refreshProfile]);

  if (isLoading || !isAuthenticated) {
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

  // Use profile display name if set, otherwise email or truncated wallet address
  const displayName =
    profile?.display_name ||
    email ||
    (walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : "Member");

  // Generate initials from display name or use default
  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email
      ? email[0].toUpperCase()
      : "N3";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        displayName={displayName}
        avatarUrl={profile?.avatar_url || undefined}
        initials={initials}
        walletAddress={walletAddress}
        tokenId={tokenId}
        authMethod={authMethod}
      />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
