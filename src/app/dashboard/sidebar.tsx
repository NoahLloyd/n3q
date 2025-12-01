"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Rocket, Users, LogOut, Vote } from "lucide-react";
import { useDisconnect } from "wagmi";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  displayName: string;
  avatarUrl?: string;
  initials: string;
  walletAddress?: string;
  tokenId?: number;
}

export function Sidebar({ displayName, avatarUrl, initials, walletAddress, tokenId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
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
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          n3q
        </Link>
        <ThemeToggle />
      </div>
      <div className="mt-6 space-y-3 text-sm text-muted-foreground">
        <Link href="/dashboard" className={itemClasses("/dashboard")}>
          <div className={iconClasses("/dashboard")}>
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Knowledge</div>
            <p className="text-xs text-muted-foreground">
              High-signal links, books, podcasts, and ideas
            </p>
          </div>
        </Link>
        <Link href="/dashboard/directory" className={itemClasses("/dashboard/directory")}>
          <div className={iconClasses("/dashboard/directory")}>
            <Users className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Directory</div>
            <p className="text-xs text-muted-foreground">
              Members and what they&apos;re working on
            </p>
          </div>
        </Link>
        <Link href="/dashboard/projects" className={itemClasses("/dashboard/projects")}>
          <div className={iconClasses("/dashboard/projects")}>
            <Rocket className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Projects</div>
            <p className="text-xs text-muted-foreground">
              Experiments and longer-term work
            </p>
          </div>
        </Link>
        <Link href="/dashboard/events" className={itemClasses("/dashboard/events")}>
          <div className={iconClasses("/dashboard/events")}>
            <CalendarDays className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-foreground">Events</div>
            <p className="text-xs text-muted-foreground">
              Sessions, dinners, and things worth showing up for
            </p>
          </div>
        </Link>
        <Link href="/dashboard/voting" className={itemClasses("/dashboard/voting")}>
          <div className={iconClasses("/dashboard/voting")}>
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
      
      {/* Profile and logout section */}
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
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
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
              <span className="text-xs font-medium text-emerald-500">Member #{tokenId}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
