"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Lightbulb,
  Wrench,
  HandHelping,
  CheckCircle,
  Trash2,
  LogOut,
  UserPlus,
  Loader2,
  Pencil,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  fetchProject,
  joinProject,
  leaveProject,
  deleteProject,
  updateProject,
} from "@/lib/supabase/projects";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "@/lib/utils";

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
    // Headers
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
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline">$1</a>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>'
    )
    // Line breaks
    .replace(/\n/g, "<br />");
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userId: address } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCreator =
    address &&
    project?.creator_id.toLowerCase() === address.toLowerCase();
  const isMember = project?.user_is_member;

  useEffect(() => {
    if (!address || !id) return;

    const loadProject = async () => {
      setIsLoading(true);
      const data = await fetchProject(id, address);
      setProject(data);
      setIsLoading(false);
    };

    loadProject();
  }, [address, id]);

  const handleJoin = async () => {
    if (!address || !project) return;

    setActionLoading("join");
    try {
      await joinProject(project.id, address);
      const updated = await fetchProject(project.id, address);
      setProject(updated);
    } catch (error) {
      console.error("Error joining project:", error);
      alert(error instanceof Error ? error.message : "Failed to join project");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    if (!address || !project) return;

    setActionLoading("leave");
    try {
      await leaveProject(project.id, address);
      const updated = await fetchProject(project.id, address);
      setProject(updated);
    } catch (error) {
      console.error("Error leaving project:", error);
      alert(error instanceof Error ? error.message : "Failed to leave project");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!address || !project) return;

    setActionLoading("delete");
    try {
      await deleteProject(project.id, address);
      router.push("/dashboard/projects");
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete project"
      );
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!address || !project || !isCreator) return;

    setActionLoading("status");
    try {
      const updated = await updateProject(project.id, address, {
        status: newStatus,
      });
      setProject(updated);
    } catch (error) {
      console.error("Error updating status:", error);
      alert(
        error instanceof Error ? error.message : "Failed to update status"
      );
    } finally {
      setActionLoading(null);
    }
  };

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
          href="/dashboard/projects"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Projects
        </Link>
        <p className="text-sm text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const status = statusConfig[project.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Projects
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {project.title}
          </h1>
          {isCreator ? (
            <Select
              value={project.status}
              onValueChange={(v) => handleStatusChange(v as ProjectStatus)}
              disabled={actionLoading === "status"}
            >
              <SelectTrigger className={`w-auto gap-2 ${status.color}`}>
                <StatusIcon className="h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="looking_for_help">Looking for Help</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={`shrink-0 ${status.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          )}
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

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isMember && (
          <Button
            onClick={handleJoin}
            disabled={actionLoading === "join"}
            size="sm"
            className="gap-2"
          >
            {actionLoading === "join" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Join Project
          </Button>
        )}

        {isMember && !isCreator && (
          <Button
            onClick={handleLeave}
            disabled={actionLoading === "leave"}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {actionLoading === "leave" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Leave Project
          </Button>
        )}

        {isCreator && (
          <>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Are you sure?</span>
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading === "delete"}
                  variant="destructive"
                  size="sm"
                >
                  {actionLoading === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Yes, delete"
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Description */}
      {project.description && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              About
              {isCreator && (
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                </Link>
              )}
            </CardTitle>
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


