"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Eye, Edit3, Globe, Lock } from "lucide-react";
import { useAccount } from "wagmi";
import { fetchProject, updateProject } from "@/lib/supabase/projects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Project, ProjectStatus } from "@/lib/supabase/types";

const statusOptions: { value: ProjectStatus; label: string; description: string }[] = [
  {
    value: "idea",
    label: "Idea",
    description: "Just an idea, exploring possibilities",
  },
  {
    value: "in_progress",
    label: "In Progress",
    description: "Actively being worked on",
  },
  {
    value: "looking_for_help",
    label: "Looking for Help",
    description: "Open for collaborators to join",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Finished or shipped",
  },
];

// Simple markdown renderer for preview
function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-semibold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-500 hover:underline">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>')
    .replace(/\n/g, '<br />');
}

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { address } = useAccount();
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!address || !id) return;

    const loadProject = async () => {
      setIsLoading(true);
      const data = await fetchProject(id, address);
      if (data) {
        setProject(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setStatus(data.status);
        setIsPublic(data.is_public || false);
      }
      setIsLoading(false);
    };

    loadProject();
  }, [address, id]);

  const isCreator =
    address && project?.creator_id.toLowerCase() === address.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address || !project) {
      alert("Please connect your wallet");
      return;
    }

    if (!isCreator) {
      alert("Only the project creator can edit this project");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProject(project.id, address, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        is_public: isPublic,
      });
      router.push(`/dashboard/projects/${project.id}`);
    } catch (error) {
      console.error("Error updating project:", error);
      alert(error instanceof Error ? error.message : "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-2xl">
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

  if (!isCreator) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-2xl">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Project
        </Link>
        <p className="text-sm text-muted-foreground">
          Only the project creator can edit this project.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-2xl">
      <div className="space-y-1">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Project
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Edit Project</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="What's your project called?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-none"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="text-sm font-medium">
                  Description
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-7 text-xs gap-1"
                >
                  {showPreview ? (
                    <>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
              {showPreview ? (
                <div className="min-h-[200px] p-3 border border-border bg-background text-sm">
                  {description ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(description),
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Nothing to preview yet
                    </p>
                  )}
                </div>
              ) : (
                <Textarea
                  id="description"
                  placeholder="Describe your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={10}
                  className="resize-none rounded-none font-mono text-sm"
                  maxLength={5000}
                />
              )}
              <p className="text-xs text-muted-foreground">
                Supports basic markdown: **bold**, *italic*, [links](url), # headings
              </p>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Status</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`p-4 border text-left transition-colors ${
                      status === option.value
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="font-medium text-sm">{option.label}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Visibility</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-4 border text-left transition-colors ${
                    !isPublic
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm">Members Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only N3Q members can see this project
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-4 border text-left transition-colors ${
                    isPublic
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium text-sm">Public</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anyone can view this project, even non-members
                  </p>
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Link href={`/dashboard/projects/${project.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}


