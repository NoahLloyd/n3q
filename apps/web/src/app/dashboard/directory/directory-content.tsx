"use client";

import { useEffect, useState } from "react";
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

interface DirectoryContentProps {
  isPublic?: boolean;
}

export function DirectoryContent({ isPublic = false }: DirectoryContentProps) {
  const { userId: address, isMember } = useAuth();
  const { members, totalSupply, isLoading } = useAllMembers();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);

  // Pending members state
  const [showPending, setShowPending] = useState(false);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  // Fetch profiles for all members
  useEffect(() => {
    if (!members || members.length === 0) return;

    const fetchProfiles = async () => {
      setProfilesLoading(true);
      const profilesMap: Record<string, Profile> = {};

      // Fetch profiles for all member addresses
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

  const getDisplayName = (memberAddress: string) => {
    const profile = profiles[memberAddress.toLowerCase()];
    if (profile?.display_name) {
      return profile.display_name;
    }
    return `${memberAddress.slice(0, 6)}...${memberAddress.slice(-4)}`;
  };

  const getAvatar = (memberAddress: string) => {
    const profile = profiles[memberAddress.toLowerCase()];
    return profile?.avatar_url || null;
  };

  const getBio = (memberAddress: string) => {
    const profile = profiles[memberAddress.toLowerCase()];
    return profile?.bio || null;
  };

  const getInitials = (memberAddress: string) => {
    const profile = profiles[memberAddress.toLowerCase()];
    if (profile?.display_name) {
      return profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return memberAddress.slice(2, 4).toUpperCase();
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Member Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSupply !== undefined
            ? `${totalSupply} members in the community`
            : "Loading..."}
        </p>
      </div>

      {isLoading || profilesLoading ? (
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
      ) : members && members.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((memberAddress, index) => {
            const isYou =
              !isPublic &&
              memberAddress.toLowerCase() === address?.toLowerCase();
            const displayName = getDisplayName(memberAddress);
            const avatarUrl = getAvatar(memberAddress);
            const bio = getBio(memberAddress);
            const initials = getInitials(memberAddress);
            const hasProfile =
              profiles[memberAddress.toLowerCase()]?.display_name;

            return (
              <Card
                key={memberAddress}
                className={`overflow-hidden pt-0 transition-all hover:shadow-lg ${
                  isYou ? "ring-2 ring-amber-500/50" : ""
                }`}
              >
                {/* Square Image */}
                <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
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
                    #{index}
                  </div>
                  {/* You badge */}
                  {isYou && (
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
                        !hasProfile ? "font-mono text-sm" : ""
                      }`}
                    >
                      {displayName}
                    </h3>
                    <a
                      href={`https://basescan.org/address/${memberAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground font-mono hover:text-amber-500 transition-colors"
                    >
                      {memberAddress.slice(0, 6)}...{memberAddress.slice(-4)}
                    </a>
                  </div>

                  {/* Bio */}
                  {bio && (
                    <p className="text-sm text-muted-foreground">{bio}</p>
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
