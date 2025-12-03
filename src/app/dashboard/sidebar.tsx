"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  Rocket,
  Users,
  LogOut,
  Vote,
  ExternalLink,
} from "lucide-react";
import { useDisconnect } from "wagmi";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  displayName?: string;
  avatarUrl?: string;
  initials?: string;
  walletAddress?: string;
  tokenId?: number;
  isPublic?: boolean;
}

export function Sidebar({
  displayName,
  avatarUrl,
  initials,
  walletAddress,
  tokenId,
  isPublic = false,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { disconnect } = useDisconnect();

  const basePath = isPublic ? "/public" : "/dashboard";
  const knowledgePath = isPublic ? "/public/knowledge" : "/dashboard";

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/public/knowledge") {
      // For knowledge page, check exact match or with trailing slash
      if (href === "/public/knowledge") {
        return (
          pathname === "/public/knowledge" || pathname === "/public/knowledge/"
        );
      }
      return pathname === "/dashboard" || pathname === "/dashboard/";
    }
    return pathname.startsWith(href);
  };

  const itemClasses = (href: string) =>
    cn(
      "group flex flex-col items-start gap-2 border border-border/60 bg-background/60 px-3 py-3 shadow-sm transition-colors",
      isActive(href)
        ? "border-sidebar-accent bg-sidebar-accent text-sidebar-foreground"
        : "hover:border-sidebar-ring hover:bg-muted/60"
    );

  const iconClasses = (href: string) =>
    cn(
      "flex h-12 w-12 items-center justify-center bg-muted text-foreground",
      isActive(href) && "border border-border/60"
    );

  return (
    <aside className="hidden w-72 flex-col border-r border-border/60 bg-card/80 px-4 py-5 sm:flex sticky top-0 h-screen overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={isPublic ? "/public/directory" : "/dashboard"}
          className="text-sm font-semibold tracking-tight"
        >
          n3q
        </Link>
        <ThemeToggle />
      </div>
      <div className="mt-6 space-y-3 text-sm text-muted-foreground">
        <Link href={knowledgePath} className={itemClasses(knowledgePath)}>
          <div className={iconClasses(knowledgePath)}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Knowledge</div>
            <p className="text-xs text-muted-foreground">
              High-signal links, books, podcasts, and ideas
            </p>
          </div>
        </Link>
        <Link
          href={`${basePath}/directory`}
          className={itemClasses(`${basePath}/directory`)}
        >
          <div className={iconClasses(`${basePath}/directory`)}>
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Directory</div>
            <p className="text-xs text-muted-foreground">
              Members and what they&apos;re working on
            </p>
          </div>
        </Link>
        <Link
          href={`${basePath}/projects`}
          className={itemClasses(`${basePath}/projects`)}
        >
          <div className={iconClasses(`${basePath}/projects`)}>
            <Rocket className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Projects</div>
            <p className="text-xs text-muted-foreground">
              Experiments and longer-term work
            </p>
          </div>
        </Link>
        <Link
          href={`${basePath}/events`}
          className={itemClasses(`${basePath}/events`)}
        >
          <div className={iconClasses(`${basePath}/events`)}>
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Events</div>
            <p className="text-xs text-muted-foreground">
              Sessions, dinners, and things worth showing up for
            </p>
          </div>
        </Link>
        <Link
          href={`${basePath}/voting`}
          className={itemClasses(`${basePath}/voting`)}
        >
          <div className={iconClasses(`${basePath}/voting`)}>
            <Vote className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Voting</div>
            <p className="text-xs text-muted-foreground">
              Polls and governance decisions
            </p>
          </div>
        </Link>
      </div>

      {/* Profile and logout section - only for authenticated users */}
      {!isPublic && (
        <div className="mt-auto pt-6 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <Link
              href="/dashboard/profile"
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 min-w-0 flex-1",
                isActive("/dashboard/profile")
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "hover:bg-muted hover:text-foreground"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-[10px]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{displayName}</span>
            </Link>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              title="Disconnect wallet"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>

          {/* Membership badge - now below profile */}
          {tokenId !== undefined && (
            <div className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">
                  Member #{tokenId}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Public view CTA */}
      {isPublic && (
        <div className="mt-auto pt-6 space-y-3">
          <div className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-500">
                Guest View
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              You&apos;re viewing limited public content
            </p>
            <a
              href="https://ninethreequarters.com/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Become a member
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Sign in with wallet
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
}
