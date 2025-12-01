"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useAllMembers } from "@/lib/web3/hooks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const supabase = createSupabaseBrowserClient();

export function DirectoryContent() {
  const { address } = useAccount();
  const { members, totalSupply, isLoading } = useAllMembers();
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [profilesLoading, setProfilesLoading] = useState(false);

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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Directory</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalSupply !== undefined ? `${totalSupply} members` : "Loading..."}
        </p>
      </div>

      {isLoading || profilesLoading ? (
        <p className="text-sm text-muted-foreground">Loading members...</p>
      ) : members && members.length > 0 ? (
        <div className="grid gap-3">
          {members.map((memberAddress, index) => {
            const isYou =
              memberAddress.toLowerCase() === address?.toLowerCase();
            const displayName = getDisplayName(memberAddress);
            const avatarUrl = getAvatar(memberAddress);
            const initials = getInitials(memberAddress);
            const hasProfile =
              profiles[memberAddress.toLowerCase()]?.display_name;

            return (
              <Card
                key={memberAddress}
                className={
                  isYou ? "border-emerald-500/50 bg-emerald-500/5" : ""
                }
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={avatarUrl || undefined}
                          alt={displayName}
                        />
                        <AvatarFallback className="text-sm font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium border border-background">
                        #{index}
                      </div>
                    </div>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          !hasProfile ? "font-mono" : ""
                        }`}
                      >
                        {displayName}
                      </p>
                      {hasProfile && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {memberAddress.slice(0, 6)}...
                          {memberAddress.slice(-4)}
                        </p>
                      )}
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
