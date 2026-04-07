"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0a]">
      {/* Pixel grid background */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,162,54,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,162,54,0.5) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
      />

      {/* Warm ambient glow behind center */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.04] blur-[120px] pointer-events-none" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-[400px] px-6">
        <div className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] px-8 py-10 shadow-2xl shadow-amber-500/[0.03]">
          {/* Subtle inner glow at top */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Logo with glow */}
          <div className="relative flex justify-center mb-8 animate-fade-up">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-500/20 blur-[40px] animate-logo-glow" />
            <Image
              src="/n3q-favicon.png"
              alt="n3q"
              width={64}
              height={64}
              className="relative"
              style={{ imageRendering: "crisp-edges" }}
              priority
            />
          </div>

          {/* Wordmark */}
          <div className="flex justify-center mb-3 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <Image
              src="/Logo-text.png"
              alt="Nine Three Quarters"
              width={400}
              height={40}
              className="w-full max-w-[220px] h-auto opacity-90"
              style={{ imageRendering: "crisp-edges" }}
              priority
            />
          </div>

          {/* Tagline */}
          <div className="text-center mb-8 animate-fade-up" style={{ animationDelay: "0.12s" }}>
            <p className="text-[11px] text-[#7A7B70] font-departure tracking-[0.2em]">
              a free lab for builders
            </p>
          </div>

          {/* Divider */}
          <div
            className="mx-auto mb-8 h-px animate-fade-up"
            style={{
              animationDelay: "0.15s",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

          {/* Google Sign In */}
          <div className="animate-fade-up" style={{ animationDelay: "0.18s" }}>
            <div className="flex justify-center">
              <button
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="group relative w-full py-3.5 font-departure text-xs uppercase tracking-[0.2em] text-white/70 transition-all duration-300 hover:text-white/90 disabled:opacity-50"
              >
                <span className="absolute inset-0 border border-white/10 transition-colors duration-300 group-hover:border-white/20 bg-white/[0.03] group-hover:bg-white/[0.06]" />
                <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-white/20 transition-colors duration-300 group-hover:bg-white/40" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-white/20 transition-colors duration-300 group-hover:bg-white/40" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-white/20 transition-colors duration-300 group-hover:bg-white/40" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/20 transition-colors duration-300 group-hover:bg-white/40" />
                <span className="relative inline-flex items-center gap-2.5">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
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
                </span>
              </button>
            </div>
          </div>

          {/* Or divider */}
          <div className="flex items-center gap-3 my-4 animate-fade-up" style={{ animationDelay: "0.19s" }}>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06))" }} />
            <span className="text-[10px] text-[#5A5B50] font-departure uppercase tracking-[0.2em]">or</span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.06), transparent)" }} />
          </div>

          {/* Connect wallet */}
          <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex justify-center">
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, openAccountModal }) => {
                  const connected = account && chain;

                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="group relative w-full py-3.5 font-departure text-xs uppercase tracking-[0.2em] text-amber-400/90 transition-all duration-300 hover:text-amber-300"
                      >
                        <span className="absolute inset-0 border border-amber-500/25 transition-colors duration-300 group-hover:border-amber-500/50 bg-amber-500/[0.03] group-hover:bg-amber-500/[0.08]" />
                        <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-500/40 transition-colors duration-300 group-hover:bg-amber-500/70" />
                        <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500/40 transition-colors duration-300 group-hover:bg-amber-500/70" />
                        <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-500/40 transition-colors duration-300 group-hover:bg-amber-500/70" />
                        <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500/40 transition-colors duration-300 group-hover:bg-amber-500/70" />
                        <span className="relative">Enter with Wallet</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="group relative w-full py-3.5 font-departure text-xs tracking-[0.15em] text-amber-400/90 transition-all duration-300 hover:text-amber-300"
                    >
                      <span className="absolute inset-0 border border-amber-500/30 bg-amber-500/[0.04]" />
                      <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-500/60" />
                      <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500/60" />
                      <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-500/60" />
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500/60" />
                      <span className="relative">{account.displayName}</span>
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          </div>

          {/* Guest link */}
          <div className="mt-6 text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <Link
              href="/public/directory"
              className="inline-flex items-center gap-2 text-[11px] text-[#6A6B60] hover:text-[#9A9B90] font-departure transition-colors duration-300 uppercase tracking-[0.2em]"
            >
              <span className="w-3 h-px bg-current opacity-40" />
              Browse as guest
              <span className="w-3 h-px bg-current opacity-40" />
            </Link>
          </div>

          {/* Status messages */}
          {isLoading && authMethod !== null && (
            <div className="mt-6 flex items-center justify-center gap-3 animate-fade-up">
              <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
              <p className="text-[11px] font-departure text-[#6A6B60] uppercase tracking-[0.2em]">
                Verifying membership
              </p>
              <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>
          )}

          {authMethod === "wallet" && !isLoading && !isMember && (
            <div className="mt-6 animate-fade-up">
              <div className="relative border border-red-500/20 bg-red-500/[0.04] px-5 py-4">
                <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-red-500/50" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500/50" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-red-500/50" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-red-500/50" />
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-departure text-red-400/80 uppercase tracking-[0.2em]">
                    No membership token found
                  </p>
                  <p className="text-[10px] text-[#6A6B60]">
                    Contact a member to request access
                  </p>
                </div>
              </div>
            </div>
          )}

          {isAuthenticated && !isLoading && isMember && (
            <div className="mt-6 animate-fade-up">
              <div className="relative border border-amber-500/20 bg-amber-500/[0.04] px-5 py-4">
                <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-500/60" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500/60" />
                <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-500/60" />
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500/60" />
                <div className="text-center space-y-2">
                  <p className="text-[11px] font-departure text-amber-400/80 uppercase tracking-[0.2em]">
                    Access granted
                  </p>
                  <p className="text-[10px] text-[#6A6B60]">
                    Redirecting to dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
