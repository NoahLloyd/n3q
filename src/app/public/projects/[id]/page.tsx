"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Lightbulb,
  Wrench,
  HandHelping,
  CheckCircle,
} from "lucide-react";
import { fetchPublicProject } from "@/lib/supabase/projects";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "@/lib/utils";
import { PublicViewBanner } from "@/components/public-view-banner";

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  idea: {
    label: "Idea",
    icon: Lightbulb,
    color: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  },
  in_progress: {
    label: "In Progress",
    icon: Wrench,
    color: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  },
  looking_for_help: {
    label: "Looking for Help",
    icon: HandHelping,
    color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  },
};

// Simple markdown renderer
function renderMarkdown(text: string): string {
  return text
    .replace(
      /^### (.*$)/gm,
      '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>'
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>'
    )
    .replace(
      /^# (.*$)/gm,
      '<h1 class="text-xl font-semibold mt-4 mb-2">$1</h1>'
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline">$1</a>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>'
    )
    .replace(/\n/g, "<br />");
}

export default function PublicProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadProject = async () => {
      setIsLoading(true);
      const data = await fetchPublicProject(id);
      if (!data) {
        setNotFoundState(true);
      } else {
        setProject(data);
      }
      setIsLoading(false);
    };

    loadProject();
  }, [id]);

  if (notFoundState) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-3xl">
        <Link
          href="/public/projects"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Projects
        </Link>
        <p className="text-sm text-muted-foreground">
          Project not found or not publicly available.
        </p>
      </div>
    );
  }

  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/public/projects"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Projects
      </Link>

      <PublicViewBanner itemType="projects" />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {project.title}
          </h1>
          <Badge className={`shrink-0 ${status.color}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {project.member_count || 0} member
            {(project.member_count || 0) !== 1 ? "s" : ""}
          </span>
          <span>
            Created {formatDistanceToNow(new Date(project.created_at))}
            {project.creator && (
              <>
                {" "}
                by{" "}
                {project.creator.display_name ||
                  `${project.creator_id.slice(0, 6)}...`}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">About</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(project.description),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Members ({project.members?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.members && project.members.length > 0 ? (
            <div className="space-y-3">
              {project.members.map((member) => {
                const isProjectCreator =
                  member.user_id.toLowerCase() ===
                  project.creator_id.toLowerCase();
                const displayName =
                  member.user?.display_name ||
                  `${member.user_id.slice(0, 6)}...${member.user_id.slice(-4)}`;
                const initials = member.user?.display_name
                  ? member.user.display_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : member.user_id.slice(2, 4).toUpperCase();

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={member.user?.avatar_url || undefined}
                          alt={displayName}
                        />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            !member.user?.display_name ? "font-mono" : ""
                          }`}
                        >
                          {displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isProjectCreator
                            ? "Creator"
                            : `Joined ${formatDistanceToNow(
                                new Date(member.joined_at)
                              )}`}
                        </p>
                      </div>
                    </div>
                    {isProjectCreator && (
                      <Badge variant="secondary" className="text-xs">
                        Creator
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No members yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

