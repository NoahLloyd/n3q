"use client";

import { useAccount } from "wagmi";
import { useMembership, useAllMembers } from "@/lib/web3/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { address } = useAccount();
  const { tokenId, tokenURI } = useMembership();
  const { members, totalSupply } = useAllMembers();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      </div>

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Address</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          <div>
            <a
              href={`https://basescan.org/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-500 hover:underline"
            >
              View on Basescan →
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Membership Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            N3Q Membership NFT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded bg-emerald-500/20 text-2xl font-bold text-emerald-500">
              #{tokenId}
            </div>
            <div>
              <p className="font-medium">Member #{tokenId}</p>
              <p className="text-sm text-muted-foreground">Soulbound NFT on Base</p>
            </div>
          </div>

          {tokenURI && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Metadata URI</p>
              <p className="font-mono text-xs text-muted-foreground break-all">{tokenURI}</p>
            </div>
          )}

          <div className="flex gap-2">
            <a
              href={`https://basescan.org/token/0x64cE7bc6bAeC01F77970363339365E476Bcc61Bc?a=${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                View NFT on Basescan
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* DAO Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            DAO Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-3xl font-bold">{totalSupply ?? "..."}</div>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>
          <div className="flex gap-2">
            <a
              href="https://basescan.org/address/0x64cE7bc6bAeC01F77970363339365E476Bcc61Bc"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                View Contract
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Membership Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            About Your Membership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Your N3Q membership is a <strong className="text-foreground">soulbound NFT</strong> — 
            it cannot be transferred or sold. It&apos;s permanently linked to your wallet.
          </p>
          <p>
            As a member, you can participate in DAO votes and access all N3Q resources.
          </p>
          <p>
            If you ever want to leave the DAO, you can burn your membership token.
            This action is irreversible.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
