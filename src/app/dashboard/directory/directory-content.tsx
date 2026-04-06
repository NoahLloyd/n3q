"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useAllMembers } from "@/lib/web3/hooks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronDown, ChevronUp, Loader2, UserCheck, X } from "lucide-react";

const supabase = createSupabaseBrowserClient();

interface PendingMember {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_method: string;
  created_at: string;
}

interface DirectoryMember {
  key: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  walletAddress: string | null;
  index: number;
  isYou: boolean;
}

interface DirectoryContentProps {
  isPublic?: boolean;
}

export function DirectoryContent({ isPublic = false }: DirectoryContentProps) {
  const { userId: address, isMember } = useAuth();
  const { members, totalSupply, isLoading } = useAllMembers();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [googleMembers, setGoogleMembers] = useState<Profile[]>([]);
  const [googleMembersLoading, setGoogleMembersLoading] = useState(true);

  // Pending members state
  const [showPending, setShowPending] = useState(false);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Fetch profiles for all wallet members
  useEffect(() => {
    if (!members || members.length === 0) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      const profilesMap: Record<string, Profile> = {};

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .in("id", members);

      if (data) {
        data.forEach((profile) => {
          profilesMap[profile.id.toLowerCase()] = profile;
        });
      }

      setProfiles(profilesMap);
      setProfilesLoading(false);
    };

    fetchProfiles();
  }, [members]);

  // Fetch verified Google-auth members
  const fetchGoogleMembers = async () => {
    setGoogleMembersLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_method", "google")
        .eq("is_verified", true)
        .order("created_at", { ascending: true });

      setGoogleMembers(data ?? []);
    } catch (err) {
      console.error("[directory] Error fetching Google members:", err);
      setGoogleMembers([]);
    } finally {
      setGoogleMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchGoogleMembers();
  }, []);

  // Fetch pending members on mount and when expanded (for authenticated members)
  useEffect(() => {
    if (isPublic || !isMember) return;

    // Always fetch the full list via the API route (uses service client to bypass RLS)
    const fetchPending = async () => {
      setPendingLoading(true);
      try {
        const res = await fetch("/api/members/pending");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("[directory] Error fetching pending members:", err);
          setPending([]);
          setPendingCount(0);
          setPendingLoading(false);
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setPending(list);
        setPendingCount(list.length);
      } catch (err) {
        console.error("[directory] Error fetching pending members:", err);
        setPending([]);
        setPendingCount(0);
      } finally {
        setPendingLoading(false);
      }
    };

    fetchPending();
  }, [isPublic, isMember]);

  const handleVerify = async (memberId: string) => {
    setVerifying(memberId);
    try {
      const res = await fetch("/api/members/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberId,
          verifierId: address,
        }),
      });

      if (res.ok) {
        setPending((prev) => prev.filter((m) => m.id !== memberId));
        setPendingCount((c) => Math.max(0, c - 1));
        // Re-fetch Google members so the newly verified member appears in the grid
        fetchGoogleMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to verify member");
      }
    } catch (err) {
      console.error("Error verifying member:", err);
      alert("Failed to verify member");
    } finally {
      setVerifying(null);
    }
  };

  const handleReject = async (memberId: string) => {
    if (!confirm("Reject this sign-up? Their account will be removed.")) return;

    setRejecting(memberId);
    try {
      const res = await fetch("/api/members/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      });

      if (res.ok) {
        setPending((prev) => prev.filter((m) => m.id !== memberId));
        setPendingCount((c) => Math.max(0, c - 1));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to reject member");
      }
    } catch (err) {
      console.error("Error rejecting member:", err);
      alert("Failed to reject member");
    } finally {
      setRejecting(null);
    }
  };

  const getPendingInitials = (member: PendingMember) => {
    if (member.display_name) {
      return member.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (member.email) return member.email[0].toUpperCase();
    return "?";
  };

  const getInitials = (name: string | null, fallback: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return fallback.slice(0, 2).toUpperCase();
  };

  // Build unified member list from wallet + Google sources
  const directoryMembers = useMemo<DirectoryMember[]>(() => {
    const result: DirectoryMember[] = [];

    // 1. Wallet members from the smart contract
    if (members) {
      for (let i = 0; i < members.length; i++) {
        const addr = members[i];
        const profile = profiles[addr.toLowerCase()];
        result.push({
          key: addr,
          displayName: profile?.display_name || `${addr.slice(0, 6)}...${addr.slice(-4)}`,
          avatarUrl: profile?.avatar_url || null,
          bio: profile?.bio || null,
          walletAddress: addr,
          index: i,
          isYou: !isPublic && addr.toLowerCase() === address?.toLowerCase(),
        });
      }
    }

    // 2. Verified Google-only members (deduplicate against wallet members)
    const walletAddressSet = new Set(
      (members ?? []).map((addr) => addr.toLowerCase())
    );

    for (const gm of googleMembers) {
      if (gm.wallet_address && walletAddressSet.has(gm.wallet_address.toLowerCase())) {
        continue;
      }
      result.push({
        key: gm.id,
        displayName: gm.display_name || gm.email || "Member",
        avatarUrl: gm.avatar_url || null,
        bio: gm.bio || null,
        walletAddress: gm.wallet_address || null,
        index: result.length,
        isYou: !isPublic && gm.id === address,
      });
    }

    return result;
  }, [members, profiles, googleMembers, isPublic, address]);

  const isDataLoading = isLoading || profilesLoading || googleMembersLoading;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Member Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {!isDataLoading
            ? `${directoryMembers.length} members in the community`
            : "Loading..."}
        </p>
      </div>

      {isDataLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse overflow-hidden">
              <div className="aspect-square bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : directoryMembers.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {directoryMembers.map((member) => {
            const initials = getInitials(
              member.displayName !== member.key ? member.displayName : null,
              member.walletAddress ? member.walletAddress.slice(2) : member.key.slice(0, 2)
            );
            const hasName = member.displayName !== `${member.key.slice(0, 6)}...${member.key.slice(-4)}`;

            return (
              <Card
                key={member.key}
                className={`overflow-hidden pt-0 transition-all hover:shadow-lg ${
                  member.isYou ? "ring-2 ring-amber-500/50" : ""
                }`}
              >
                {/* Square Image */}
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                      <span className="text-5xl font-bold text-amber-500/60">
                        {initials}
                      </span>
                    </div>
                  )}
                  {/* Member number badge */}
                  <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-xs font-semibold text-white backdrop-blur-sm">
                    #{member.index}
                  </div>
                  {/* You badge */}
                  {member.isYou && (
                    <div className="absolute top-3 right-3 rounded-lg bg-amber-500 px-2 py-1 text-xs font-semibold text-white">
                      You
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="p-4 space-y-2">
                  <div>
                    <h3
                      className={`font-semibold text-base leading-tight ${
                        !hasName ? "font-mono text-sm" : ""
                      }`}
                    >
                      {member.displayName}
                    </h3>
                    {member.walletAddress && (
                      <a
                        href={`https://basescan.org/address/${member.walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground font-mono hover:text-amber-500 transition-colors"
                      >
                        {member.walletAddress.slice(0, 6)}...{member.walletAddress.slice(-4)}
                      </a>
                    )}
                  </div>

                  {/* Bio */}
                  {member.bio && (
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No members found.</p>
      )}

      {/* Verify pending members section */}
      {!isPublic && isMember && (
        <div className="mt-2">
          <button
            onClick={() => setShowPending(!showPending)}
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {pendingLoading
              ? "Checking pending..."
              : pendingCount > 0
                ? `${pendingCount} pending verification${pendingCount !== 1 ? "s" : ""}`
                : "No pending verifications"}
            {pendingCount > 0 &&
              (showPending ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              ))}
          </button>

          {showPending && pendingCount > 0 && (
            <div className="mt-3 space-y-2">
              {pending.map((member) => (
                <Card key={member.id}>
                  <CardContent className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage
                          src={member.avatar_url || undefined}
                          alt={member.display_name || ""}
                        />
                        <AvatarFallback className="text-xs">
                          {getPendingInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.display_name || "No name"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        onClick={() => handleReject(member.id)}
                        disabled={rejecting === member.id || verifying === member.id}
                        size="sm"
                        variant="outline"
                        className="gap-1 text-muted-foreground hover:text-red-500 hover:border-red-500/50"
                      >
                        {rejecting === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleVerify(member.id)}
                        disabled={verifying === member.id || rejecting === member.id}
                        size="sm"
                        className="gap-1.5"
                      >
                        {verifying === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        Verify
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
