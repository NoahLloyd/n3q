"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useMembership } from "@/lib/web3/hooks";

export default function LoginPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isMember, isLoading } = useMembership();

  useEffect(() => {
    if (isConnected && isMember && !isLoading) {
      router.push("/dashboard");
    }
  }, [isConnected, isMember, isLoading, router]);

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

      {/* Slow scan line effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent animate-scan-line"
        />
      </div>

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
              className="relative animate-pixel-flicker"
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
          {isConnected && isLoading && (
            <div className="mt-6 flex items-center justify-center gap-3 animate-fade-up">
              <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" />
              <p className="text-[11px] font-departure text-[#6A6B60] uppercase tracking-[0.2em]">
                Verifying membership
              </p>
              <div className="w-1.5 h-1.5 bg-amber-500 animate-pulse" style={{ animationDelay: "0.5s" }} />
            </div>
          )}

          {isConnected && !isLoading && !isMember && (
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

          {isConnected && !isLoading && isMember && (
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
