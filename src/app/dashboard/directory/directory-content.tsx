"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useAllMembers } from "@/lib/web3/hooks";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { Card } from "@/components/ui/card";

const supabase = createSupabaseBrowserClient();

interface DirectoryContentProps {
  isPublic?: boolean;
}

export function DirectoryContent({ isPublic = false }: DirectoryContentProps) {
  const { userId: address } = useAuth();
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
    </div>
  );
}
