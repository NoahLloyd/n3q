"use client";

import { Eye, ExternalLink } from "lucide-react";

interface PublicViewBannerProps {
  itemType: "projects" | "events" | "knowledge";
}

export function PublicViewBanner({ itemType }: PublicViewBannerProps) {
  const getMessage = () => {
    if (itemType === "knowledge") {
      return {
        title: "Guest view",
        description:
          "Sign in with your membership NFT to save items, rate content, comment, and see who shared each piece.",
      };
    }
    return {
      title: `Viewing public ${itemType} only`,
      description: `Most ${itemType} are members-only. You're seeing a small selection that creators have chosen to share publicly.`,
    };
  };

  const { title, description } = getMessage();

  return (
    <div className="rounded border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Eye className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <a
          href="https://ninethreequarters.com/apply"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors shrink-0"
        >
          Apply to join
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
