"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAccount } from "wagmi";
import { fetchProjects } from "@/lib/supabase/projects";
import type { Project, ProjectStatus } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "./components/project-card";

type FilterOption = "all" | ProjectStatus;

export default function ProjectsPage() {
  const { address } = useAccount();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("all");

  useEffect(() => {
    if (!address) return;

    const loadProjects = async () => {
      setIsLoading(true);
      const statusFilter = filter === "all" ? undefined : filter;
      const data = await fetchProjects(address, statusFilter);
      setProjects(data);
      setIsLoading(false);
    };

    loadProjects();
  }, [address, filter]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Experiments and longer-term work from the community
          </p>
        </div>
        <Link href="/dashboard/projects/create">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

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
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border">
      <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No projects yet. Be the first to create one!"
              : `No projects with status "${filter.replace(/_/g, " ")}"`}
          </p>
          <Link href="/dashboard/projects/create" className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
