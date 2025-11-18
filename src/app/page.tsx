"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");
    setMessage(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        console.error(error);
        setStatus("error");
        setMessage(error.message ?? "Something went wrong. Try again.");
        return;
      }

      setStatus("success");
      setMessage("Magic link sent. Check your email.");

      // If the user is already logged in for some reason, push to app.
      router.refresh();
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            n3q
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-background"
              />
            </div>
            {message && (
              <p
                className={cn(
                  "text-sm",
                  status === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {message}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !email}
            >
              {isPending ? "Sending..." : "Send magic link"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            We&apos;ll email you a link that instantly signs you in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
