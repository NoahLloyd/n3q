"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface PreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  hostname?: string;
}

export function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<PreviewData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as PreviewData;
        if (!cancelled) setData(json);
      } catch {
        // ignore
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!data) return null;

  const { title, description, image, hostname } = data;

  if (!title && !image) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="-mx-6 -mt-4 mb-2 block border-b border-border/60 bg-card no-underline"
    >
      <div className="flex gap-3 px-6 py-3">
        {image && (
          <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-muted">
            <Image
              src={image}
              alt={title ?? hostname ?? url}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className={cn("flex min-w-0 flex-1 flex-col gap-1 text-xs")}>
          {title && <div className="truncate font-medium">{title}</div>}
          {description && (
            <p className="line-clamp-2 text-muted-foreground">{description}</p>
          )}
          {hostname && (
            <span className="text-[10px] text-muted-foreground">
              {hostname}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
