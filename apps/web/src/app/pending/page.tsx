"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export default function PendingVerificationPage() {
  const router = useRouter();
  const { isAuthenticated, isMember, isPendingVerification, isLoading, email, signOut, refreshProfile } = useAuth();

  // Redirect if already verified or not authenticated
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    if (isMember) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isMember, isLoading, router]);

  // Poll for verification status every 10 seconds
  useEffect(() => {
    if (!isPendingVerification) return;

    const interval = setInterval(() => {
      refreshProfile();
    }, 10000);

    return () => clearInterval(interval);
  }, [isPendingVerification, refreshProfile]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-4">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-amber-500/60" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-amber-500/60" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-amber-500/60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-amber-500/60" />
        </div>

        <div className="relative bg-card/40 backdrop-blur-sm p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-mono font-medium tracking-[0.2em] text-foreground uppercase">
              Nine Three Quarters
            </h1>
          </div>

          <div className="relative">
            <div className="absolute -inset-px">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-500/60" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-500/60" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-500/60" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-500/60" />
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-amber-500 animate-pulse" />
                <p className="text-sm font-mono text-amber-400 uppercase tracking-wide">
                  Pending Verification
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your account{email ? ` (${email})` : ""} is awaiting verification by an existing member.
              </p>
              <p className="text-xs text-muted-foreground">
                This page will update automatically once you&apos;re approved.
              </p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handleSignOut}
              className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
