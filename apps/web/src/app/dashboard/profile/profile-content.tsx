"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Loader2, Check, Monitor, Wallet, Smartphone, RefreshCw } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/lib/auth/context";
import { useMembership, useAllMembers } from "@/lib/web3/hooks";
import {
  getOrCreateProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/supabase/profile";
import type { Profile } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export function ProfileContent() {
  const { userId, authMethod, walletAddress, email, isWalletConnected, linkWallet, profile: authProfile } = useAuth();
  const { tokenId, tokenURI } = useMembership();
  const { totalSupply } = useAllMembers();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // When a Google user connects a wallet, save the address to their profile
  useEffect(() => {
    if (authMethod === "google" && isWalletConnected && walletAddress) {
      // Only link if not already saved
      if (authProfile?.wallet_address !== walletAddress) {
        linkWallet(walletAddress);
      }
    }
  }, [authMethod, isWalletConnected, walletAddress, authProfile?.wallet_address, linkWallet]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveBioSuccess, setSaveBioSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      getOrCreateProfile(userId).then((p) => {
        setProfile(p);
        setDisplayName(p?.display_name || "");
        setBio(p?.bio || "");
        setIsLoading(false);
      });
    }
  }, [userId]);

  const handleSaveDisplayName = async () => {
    if (!userId) return;

    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateProfile(userId, {
        display_name: displayName.trim() || null,
      });
      setProfile(updated);
      setSaveSuccess(true);
      window.dispatchEvent(new Event("profile-updated"));
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving display name:", error);
      alert("Failed to save display name");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBio = async () => {
    if (!userId) return;

    setIsSavingBio(true);
    setSaveBioSuccess(false);
    try {
      const updated = await updateProfile(userId, {
        bio: bio.trim() || null,
      });
      setProfile(updated);
      setSaveBioSuccess(true);
      setTimeout(() => setSaveBioSuccess(false), 2000);
    } catch (error) {
      console.error("Error saving bio:", error);
      alert("Failed to save bio");
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const newAvatarUrl = await uploadAvatar(userId, file);
      if (newAvatarUrl) {
        setProfile((prev) =>
          prev ? { ...prev, avatar_url: newAvatarUrl } : null
        );
        window.dispatchEvent(new Event("profile-updated"));
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert(
        "Failed to upload avatar. Make sure the avatars storage bucket exists in Supabase."
      );
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
    : email
      ? email[0].toUpperCase()
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
                <AvatarImage
                  src={profile?.avatar_url || undefined}
                  alt={displayName || "Profile"}
                />
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
              This name will be shown across votes, comments, and shared
              knowledge
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
                disabled={
                  isSaving || displayName === (profile?.display_name || "")
                }
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

          {/* Bio */}
          <div className="space-y-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <p className="text-xs text-muted-foreground">
              Tell other members about yourself, your interests, and what
              you&apos;re working on
            </p>
            <Textarea
              id="bio"
              placeholder="Write a short bio about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {bio.length}/500 characters
              </span>
              <Button
                onClick={handleSaveBio}
                disabled={isSavingBio || bio === (profile?.bio || "")}
              >
                {isSavingBio ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saveBioSuccess ? (
                  <Check className="h-4 w-4" />
                ) : (
                  "Save Bio"
                )}
              </Button>
            </div>
          </div>

          {/* Email (for Google users) */}
          {email && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Card - show for wallet users or as connect option for Google users */}
      {authMethod === "wallet" && walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Address
              </p>
              <p className="font-mono text-sm break-all">{walletAddress}</p>
            </div>
            <div>
              <a
                href={`https://basescan.org/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-500 hover:underline"
              >
                View on Basescan →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {authMethod === "google" && !isWalletConnected && !authProfile?.wallet_address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Connect Wallet (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect a wallet to access on-chain features like NFT membership
              and governance.
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  onClick={openConnectModal}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </CardContent>
        </Card>
      )}

      {authMethod === "google" && isWalletConnected && walletAddress && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Connected Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Address
              </p>
              <p className="font-mono text-sm break-all">{walletAddress}</p>
            </div>
            <div>
              <a
                href={`https://basescan.org/address/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-amber-500 hover:underline"
              >
                View on Basescan →
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NFT Card - only for wallet users with membership */}
      {authMethod === "wallet" && tokenId !== undefined && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                N3Q Membership NFT
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded bg-amber-500/20 text-2xl font-bold text-amber-500">
                  #{tokenId}
                </div>
                <div>
                  <p className="font-medium">Member #{tokenId}</p>
                  <p className="text-sm text-muted-foreground">
                    Soulbound NFT on Base
                  </p>
                </div>
              </div>

              {tokenURI && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Metadata URI
                  </p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {tokenURI}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <a
                  href={`https://basescan.org/token/0x64cE7bc6bAeC01F77970363339365E476Bcc61Bc?a=${walletAddress}`}
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
                <div className="text-3xl font-bold">
                  {totalSupply ?? "..."}
                </div>
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
                Your N3Q membership is a{" "}
                <strong className="text-foreground">soulbound NFT</strong> — it
                cannot be transferred or sold. It&apos;s permanently linked to
                your wallet.
              </p>
              <p>
                As a member, you can participate in DAO votes and access all N3Q
                resources.
              </p>
              <p>
                If you ever want to leave the DAO, you can burn your membership
                token. This action is irreversible.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Google auth membership info */}
      {authMethod === "google" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              About Your Membership
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              You joined via Google sign-in and were verified by an existing
              member.
            </p>
            <p>
              You have full access to the community. You can optionally connect
              a wallet to participate in on-chain governance and receive a
              membership NFT.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Link Mobile App */}
      <MobileLinkCard />

      {/* Display Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Display Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Full-screen dashboard for office monitors showing knowledge, events,
            projects, and polls.
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

function MobileLinkCard() {
  const { userId } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setCode(null);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const generateCode = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/auth/mobile-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to generate code");
        return;
      }
      const data = await res.json();
      setCode(data.code);
      setExpiresAt(data.expires_at);
    } catch (error) {
      console.error("Error generating mobile code:", error);
      alert("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Mobile App</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!code ? (
          <>
            <p className="text-sm text-muted-foreground">
              Generate a one-time code to sign in on the N3Q mobile app.
            </p>
            <Button
              onClick={generateCode}
              disabled={isGenerating}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
              Generate Login Code
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter this code in the N3Q mobile app:
            </p>
            <div className="relative py-5 border border-amber-500/25 bg-amber-500/[0.03]">
              <span className="absolute top-0 left-0 w-1.5 h-1.5 bg-amber-500/40" />
              <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-amber-500/40" />
              <span className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-amber-500/40" />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-amber-500/40" />
              <p className="text-center font-departure text-3xl tracking-[0.5em] text-amber-400/90">
                {code}
              </p>
            </div>
            <p className="text-xs text-muted-foreground text-center font-departure uppercase tracking-[0.15em]">
              Expires in {minutes}:{seconds.toString().padStart(2, "0")}
            </p>
            <div className="flex justify-center">
              <Button
                onClick={generateCode}
                disabled={isGenerating}
                variant="ghost"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-3 w-3" />
                Generate New Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
