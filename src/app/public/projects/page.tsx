"use client";

import { useEffect, useState } from "react";
import { fetchPublicProjects } from "@/lib/supabase/projects";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/app/dashboard/projects/components/project-card";
import { PublicViewBanner } from "@/components/public-view-banner";

type FilterOption = "all" | ProjectStatus;

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    const loadProjects = async () => {
      setIsLoading(true);
      const statusFilter = filter === "all" ? undefined : filter;
      const data = await fetchPublicProjects(statusFilter);
      setProjects(data);
      setIsLoading(false);
    };

    loadProjects();
  }, [filter]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Experiments and longer-term work from the community
          </p>
        </div>
      </div>

      <PublicViewBanner itemType="projects" />

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterOption)}
        className="w-full"
      >
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          <TabsTrigger value="looking_for_help" className="text-xs">
            Looking for Help
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-xs">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="idea" className="text-xs">
            Ideas
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      ) : projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} isPublic />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No public projects available yet."
              : `No public projects with status "${filter.replace(/_/g, " ")}"`}
          </p>
        </div>
      )}
    </div>
  );
}

