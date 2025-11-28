"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useMembership } from "@/lib/web3/hooks";
import { Sidebar } from "./sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { isMember, isLoading, tokenId } = useMembership();

  useEffect(() => {
    // If not connected, redirect to login
    if (!isConnected) {
      router.push("/");
      return;
    }

    // If connected but not a member (and done loading), redirect to login
    if (!isLoading && !isMember) {
      router.push("/");
    }
  }, [isConnected, isMember, isLoading, router]);

  // Show loading while checking membership
  if (!isConnected || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying membership...</p>
        </div>
      </div>
    );
  }

  // If not a member, don't render anything (will redirect)
  if (!isMember) {
    return null;
  }

  // Format display name from address
  const displayName = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Member";

  const initials = "N3";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        displayName={displayName}
        avatarUrl={undefined}
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
