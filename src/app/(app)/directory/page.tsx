"use client";

import { useAccount } from "wagmi";
import { useAllMembers } from "@/lib/web3/hooks";
import { Card, CardContent } from "@/components/ui/card";

export default function DirectoryPage() {
  const { address } = useAccount();
  const { members, totalSupply, isLoading } = useAllMembers();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSupply !== undefined ? `${totalSupply} members` : "Loading..."}
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : members && members.length > 0 ? (
        <div className="grid gap-3">
          {members.map((memberAddress, index) => {
            const isYou = memberAddress.toLowerCase() === address?.toLowerCase();
            return (
              <Card
                key={memberAddress}
                className={isYou ? "border-emerald-500/50 bg-emerald-500/5" : ""}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-sm font-medium">
                      #{index}
                    </div>
                    <div>
                      <p className="font-mono text-sm">
                        {memberAddress.slice(0, 6)}...{memberAddress.slice(-4)}
                      </p>
                      {isYou && (
                        <p className="text-xs text-emerald-500">This is you</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://basescan.org/address/${memberAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    View →
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No members found.</p>
      )}
    </div>
  );
}
