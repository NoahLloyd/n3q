"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Loader2, UserCheck } from "lucide-react";

interface PendingMember {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_method: string;
  created_at: string;
}

export default function MembersPage() {
  const { userId } = useAuth();
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members/pending");
      const data = await res.json();
      setPending(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching pending members:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (memberId: string) => {
    setVerifying(memberId);
    try {
      const res = await fetch("/api/members/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: memberId,
          verifierId: userId,
        }),
      });

      if (res.ok) {
        setPending((prev) => prev.filter((m) => m.id !== memberId));
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

  const getInitials = (member: PendingMember) => {
    if (member.display_name) {
      return member.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (member.email) {
      return member.email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Member Verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve new members who signed up with Google
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UserCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No pending verification requests
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((member) => (
            <Card key={member.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={member.avatar_url || undefined}
                      alt={member.display_name || ""}
                    />
                    <AvatarFallback>{getInitials(member)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {member.display_name || "No name"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Signed up{" "}
                      {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleVerify(member.id)}
                  disabled={verifying === member.id}
                  size="sm"
                  className="shrink-0 gap-1.5"
                >
                  {verifying === member.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Verify
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
