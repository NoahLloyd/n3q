"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/lib/auth/context";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isMember, isPendingVerification, isLoading, authMethod } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && isMember) {
      router.push("/dashboard");
    } else if (isAuthenticated && isPendingVerification) {
      router.push("/pending");
    }
  }, [isAuthenticated, isMember, isPendingVerification, isLoading, router]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google sign-in error:", error);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm">
        {/* Corner frame */}
        <div className="absolute -inset-4">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/60" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/60" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-500/60" />
        </div>

        <div className="relative bg-card/40 backdrop-blur-sm p-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-mono font-medium tracking-[0.2em] text-foreground uppercase">
              Nine Three Quarters
            </h1>
          </div>

          {/* Connect section */}
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground font-mono">
              Sign in to access the community
            </p>

            {/* Google Sign In */}
            <div className="flex justify-center">
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 px-8 py-3 bg-white/5 border border-border/60 text-foreground font-mono text-sm tracking-wider hover:bg-white/10 hover:border-foreground/30 transition-all duration-200 disabled:opacity-50"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {googleLoading ? "Redirecting..." : "Continue with Google"}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/60" />
              <span className="text-xs text-muted-foreground font-mono">or</span>
              <div className="flex-1 h-px bg-border/60" />
            </div>

            {/* Wallet Connect */}
            <div className="flex justify-center">
              <div className="relative group w-full">
                <div className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-400" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-400" />
                </div>
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, openAccountModal }) => {
                    const connected = account && chain;

                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="w-full px-8 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-sm uppercase tracking-wider hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-200"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="w-full px-8 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-sm tracking-wider hover:bg-emerald-500/20 transition-all duration-200"
                      >
                        {account.displayName}
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            </div>

            {/* Browse as Guest */}
            <div className="text-center pt-2">
              <Link
                href="/public/directory"
                className="text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
              >
                or browse as guest →
              </Link>
            </div>
          </div>

          {/* Status messages */}
          {isLoading && authMethod !== null && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-2 h-2 bg-emerald-500 animate-pulse" />
              <p className="text-sm font-mono text-muted-foreground">
                Verifying membership...
              </p>
            </div>
          )}

          {authMethod === "wallet" && !isLoading && !isMember && (
            <div className="relative">
              <div className="absolute -inset-px">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red-500/60" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/60" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red-500/60" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red-500/60" />
              </div>
              <div className="bg-red-500/5 border border-red-500/20 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500" />
                  <p className="text-sm font-mono text-red-400 uppercase tracking-wide">
                    Access Denied
                  </p>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  No N3Q membership token detected
                </p>
                <p className="text-xs text-muted-foreground">
                  Contact a member to request access
                </p>
              </div>
            </div>
          )}

          {isAuthenticated && !isLoading && isMember && (
            <div className="relative">
              <div className="absolute -inset-px">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-emerald-500/60" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-emerald-500/60" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-emerald-500/60" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-emerald-500/60" />
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500" />
                  <p className="text-sm font-mono text-emerald-400 uppercase tracking-wide">
                    Access Granted
                  </p>
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
