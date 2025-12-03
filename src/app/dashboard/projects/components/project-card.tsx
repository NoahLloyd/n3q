"use client";

import Link from "next/link";
import { Users, Lightbulb, Wrench, HandHelping, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { formatDistanceToNow } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

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

export function ProjectCard({ project }: ProjectCardProps) {
  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  // Get first ~150 chars of description for preview, strip markdown
  const descriptionPreview = project.description
    ? project.description
        .replace(/[#*`[\]()]/g, "")
        .replace(/\n+/g, " ")
        .slice(0, 150)
        .trim() + (project.description.length > 150 ? "..." : "")
    : null;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="rounded-none hover:border-sidebar-ring transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {project.title}
            </CardTitle>
            <Badge className={`shrink-0 text-xs ${status.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {descriptionPreview && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {descriptionPreview}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {project.member_count || 0} member{(project.member_count || 0) !== 1 ? "s" : ""}
              </span>
            </div>
            <span>
              {formatDistanceToNow(new Date(project.created_at))}
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
        </CardContent>
      </Card>
    </Link>
  );
}


