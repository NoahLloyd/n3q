import { createSupabaseBrowserClient } from "./client";
import {
  fetchProjects as _fetchProjects,
  fetchProject as _fetchProject,
  createProject as _createProject,
  updateProject as _updateProject,
  deleteProject as _deleteProject,
  joinProject as _joinProject,
  leaveProject as _leaveProject,
  fetchPublicProjects as _fetchPublicProjects,
  fetchPublicProject as _fetchPublicProject,
} from "@n3q/shared";
import type { Project, ProjectMember, ProjectStatus } from "@n3q/shared";

const supabase = createSupabaseBrowserClient();

export async function fetchProjects(userId: string, statusFilter?: ProjectStatus): Promise<Project[]> {
  return _fetchProjects(supabase, userId, statusFilter);
}

export async function fetchProject(projectId: string, userId: string): Promise<Project | null> {
  return _fetchProject(supabase, projectId, userId);
}

export async function createProject(
  userId: string,
  title: string,
  description: string | null,
  status: ProjectStatus,
  isPublic: boolean = false
): Promise<Project | null> {
  return _createProject(supabase, userId, title, description, status, isPublic);
}

export async function updateProject(
  projectId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string | null;
    status?: ProjectStatus;
    is_public?: boolean;
  }
): Promise<Project | null> {
  return _updateProject(supabase, projectId, userId, updates);
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  return _deleteProject(supabase, projectId, userId);
}

export async function joinProject(projectId: string, userId: string): Promise<ProjectMember> {
  return _joinProject(supabase, projectId, userId);
}

export async function leaveProject(projectId: string, userId: string): Promise<boolean> {
  return _leaveProject(supabase, projectId, userId);
}

export async function fetchPublicProjects(statusFilter?: ProjectStatus): Promise<Project[]> {
  return _fetchPublicProjects(supabase, statusFilter);
}

export async function fetchPublicProject(projectId: string): Promise<Project | null> {
  return _fetchPublicProject(supabase, projectId);
}
