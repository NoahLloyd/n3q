"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddItemFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function AddItemForm({ userId, onSuccess }: AddItemFormProps) {
  const [link, setLink] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("You need to be connected.");
      return;
    }

    const trimmedLink = link.trim();

    if (!trimmedLink) {
      setError("Please paste a valid link.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/content/enrich", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: trimmedLink,
            userId,
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          setError(body.error ?? "Failed to save link.");
          return;
        }
      } catch (err) {
        console.error("Failed to enrich link", err);
        setError("Could not add link. Please try again.");
        return;
      }

      setLink("");
      onSuccess?.();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex-1 space-y-2">
        <div className="flex flex-col gap-2">
          <Input
            type="url"
            inputMode="url"
            placeholder="Paste a link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            required
          />
        </div>
        {error && <p className={cn("text-xs text-destructive")}>{error}</p>}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isPending || link.trim().length === 0}
      >
        {isPending ? "Adding…" : "Add to feed"}
      </Button>
    </form>
  );
}
