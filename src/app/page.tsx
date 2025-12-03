"use client";

import { useEffect } from "react";
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative w-full max-w-sm">
        {/* Corner frame */}
        <div className="absolute -inset-4">
          {/* Top left corner */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-500/60" />
          {/* Top right corner */}
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-500/60" />
          {/* Bottom left corner */}
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-500/60" />
          {/* Bottom right corner */}
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
              Connect wallet to authenticate
            </p>

            {/* Custom wrapper for ConnectButton */}
            <div className="flex justify-center">
              <div className="relative group">
                {/* Corner accents for button */}
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
                          className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-sm uppercase tracking-wider hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-200"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-mono text-sm tracking-wider hover:bg-emerald-500/20 transition-all duration-200"
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
          {isConnected && isLoading && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-2 h-2 bg-emerald-500 animate-pulse" />
              <p className="text-sm font-mono text-muted-foreground">
                Verifying membership...
              </p>
            </div>
          )}

          {isConnected && !isLoading && !isMember && (
            <div className="relative">
              {/* Corner accents */}
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

          {isConnected && !isLoading && isMember && (
            <div className="relative">
              {/* Corner accents */}
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

          {/* Footer */}
        </div>
      </div>
    </div>
  );
}
