"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentType } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const supabase = createSupabaseBrowserClient();

export function AddItemForm() {
  const router = useRouter();
  const [type, setType] = useState<ContentType>("article");
  const [urlOrTitle, setUrlOrTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You need to be logged in.");
        return;
      }

      // Ensure a profile row exists for this user so content_items inserts
      // don't violate the foreign key to profiles.id.
      await supabase.from("profiles").upsert(
        {
          id: user.id,
        },
        { onConflict: "id" }
      );

      const isLikelyUrl =
        urlOrTitle.startsWith("http://") || urlOrTitle.startsWith("https://");

      const title = isLikelyUrl ? urlOrTitle : urlOrTitle.trim();
      const url = isLikelyUrl ? urlOrTitle : null;

      const { error: insertError } = await supabase
        .from("content_items")
        .insert({
          creator_id: user.id,
          type,
          title,
          url,
        });

      if (insertError) {
        console.error(insertError);
        setError(insertError.message ?? "Could not add item.");
        return;
      }

      setUrlOrTitle("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex-1 space-y-2">
        <div className="flex flex-col gap-2">
          <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="podcast">Podcast</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Paste a link or type a title"
            value={urlOrTitle}
            onChange={(e) => setUrlOrTitle(e.target.value)}
            required
          />
        </div>
        {error && <p className={cn("text-xs text-destructive")}>{error}</p>}
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Adding…" : "Add to feed"}
      </Button>
    </form>
  );
}
