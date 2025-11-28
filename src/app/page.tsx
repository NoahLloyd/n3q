"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useMembership } from "@/lib/web3/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { isMember, isLoading } = useMembership();

  useEffect(() => {
    if (isConnected && isMember && !isLoading) {
      router.push("/app");
    }
  }, [isConnected, isMember, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            n3q
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-sm text-muted-foreground">
            Connect your wallet to access the N3Q hacker house hub.
          </p>
          
          <div className="flex justify-center">
            <ConnectButton />
          </div>

          {isConnected && isLoading && (
            <p className="text-center text-sm text-muted-foreground">
              Checking membership...
            </p>
          )}

          {isConnected && !isLoading && !isMember && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-sm font-medium text-destructive">
                You don&apos;t have an N3Q membership NFT.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contact a DAO member to request membership.
              </p>
            </div>
          )}

          {isConnected && !isLoading && isMember && (
            <div className="rounded-md border border-emerald-500/50 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm font-medium text-emerald-500">
                ✓ Membership verified! Redirecting...
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            N3Q membership is a soulbound NFT on Base.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
