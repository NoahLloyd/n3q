"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { Camera, Loader2, Check, Monitor } from "lucide-react";
import { useMembership, useAllMembers } from "@/lib/web3/hooks";
import { getOrCreateProfile, updateProfile, uploadAvatar } from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function ProfileContent() {
  const { address } = useAccount();
  const { tokenId, tokenURI } = useMembership();
  const { totalSupply } = useAllMembers();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address) {
      setIsLoading(true);
      getOrCreateProfile(address).then((p) => {
        setProfile(p);
        setDisplayName(p?.display_name || "");
        setIsLoading(false);
      });
    }
  }, [address]);

  const handleSaveDisplayName = async () => {
    if (!address) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateProfile(address, {
        display_name: displayName.trim() || null,
      });
      setProfile(updated);
      setSaveSuccess(true);
      // Notify the layout to refresh sidebar
      window.dispatchEvent(new Event("profile-updated"));
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving display name:", error);
      alert("Failed to save display name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !address) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const newAvatarUrl = await uploadAvatar(address, file);
      if (newAvatarUrl) {
        setProfile((prev) => prev ? { ...prev, avatar_url: newAvatarUrl } : null);
        // Notify the layout to refresh sidebar
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar. Make sure the avatars storage bucket exists in Supabase.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "N3";

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
      </div>

      {/* Profile Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Your Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName || "Profile"} />
                <AvatarFallback className="text-xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Camera className="h-6 w-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Profile Picture</p>
              <p className="text-xs text-muted-foreground">
                Click to upload (max 2MB)
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">
              Display Name
            </label>
            <p className="text-xs text-muted-foreground">
              This name will be shown across votes, comments, and shared knowledge
            </p>
            <div className="flex gap-2">
              <Input
                id="displayName"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1"
                maxLength={50}
              />
              <Button
                onClick={handleSaveDisplayName}
                disabled={isSaving || displayName === (profile?.display_name || "")}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Display Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Display Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Full-screen dashboard for office monitors showing knowledge, events, projects, and polls.
          </p>
          <Link href="/dashboard/display">
            <Button variant="outline" size="sm" className="gap-2">
              <Monitor className="h-4 w-4" />
              Open Display Mode
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
