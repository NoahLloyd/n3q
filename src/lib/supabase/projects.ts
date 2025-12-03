import { createSupabaseBrowserClient } from "./client";
import type { Project, ProjectMember, ProjectStatus, Profile } from "./types";

const supabase = createSupabaseBrowserClient();

async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function fetchProjects(
  userId: string,
  statusFilter?: ProjectStatus
): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error("Error fetching projects:", error);
    return [];
  }

  // Get member counts and check user membership for all projects
  const projectIds = (projects || []).map((p) => p.id);

  const { data: allMembers } = await supabase
    .from("project_members")
    .select("*")
    .in("project_id", projectIds);

  // Fetch creator profiles
  const creatorIds = [...new Set((projects || []).map((p) => p.creator_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of creatorIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  return (projects || []).map((project) => {
    const projectMembers = (allMembers || []).filter(
      (m) => m.project_id === project.id
    );
    const userIsMember = projectMembers.some(
      (m) => m.user_id.toLowerCase() === userId.toLowerCase()
    );

    return {
      ...project,
      creator: profiles[project.creator_id] || null,
      member_count: projectMembers.length,
      user_is_member: userIsMember,
    };
  });
}

export async function fetchProject(
  projectId: string,
  userId: string
): Promise<Project | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    console.error("Error fetching project:", error);
    return null;
  }

  // Fetch members
  const { data: members } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  // Fetch profiles for all members
  const memberUserIds = [...new Set((members || []).map((m) => m.user_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of memberUserIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  // Fetch creator profile
  const creator = await getProfile(project.creator_id);

  const membersWithProfiles: ProjectMember[] = (members || []).map((m) => ({
    ...m,
    user: profiles[m.user_id] || null,
  }));

  const userIsMember = membersWithProfiles.some(
    (m) => m.user_id.toLowerCase() === userId.toLowerCase()
  );

  return {
    ...project,
    creator,
    members: membersWithProfiles,
    member_count: membersWithProfiles.length,
    user_is_member: userIsMember,
  };
}

export async function createProject(
  userId: string,
  title: string,
  description: string | null,
  status: ProjectStatus,
  isPublic: boolean = false
): Promise<Project | null> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      creator_id: userId,
      title,
      description,
      status,
      is_public: isPublic,
    })
    .select()
    .single();

  if (projectError) {
    console.error("Error creating project:", projectError);
    throw new Error(projectError.message);
  }

  // Auto-add creator as first member
  const { error: memberError } = await supabase
    .from("project_members")
    .insert({
      project_id: project.id,
      user_id: userId,
    });

  if (memberError) {
    console.error("Error adding creator as member:", memberError);
    // Don't fail the whole operation, project is created
  }

  return fetchProject(project.id, userId);
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
  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id.toLowerCase() !== userId.toLowerCase()) {
    throw new Error("Only the project creator can update this project");
  }

  const { error } = await supabase
    .from("projects")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    console.error("Error updating project:", error);
    throw new Error(error.message);
  }

  return fetchProject(projectId, userId);
}

export async function deleteProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const { data: project } = await supabase
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id.toLowerCase() !== userId.toLowerCase()) {
    throw new Error("Only the project creator can delete this project");
  }

  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    console.error("Error deleting project:", error);
    throw new Error(error.message);
  }

  return true;
}

export async function joinProject(
  projectId: string,
  userId: string
): Promise<ProjectMember> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  // Check if already a member
  const { data: existing } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    throw new Error("You are already a member of this project");
  }

  const { data: member, error } = await supabase
    .from("project_members")
    .insert({
      project_id: projectId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error joining project:", error);
    throw new Error(error.message);
  }

  const profile = await getProfile(userId);

  return {
    ...member,
    user: profile,
  };
}

export async function leaveProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  // Check if user is the creator
  const { data: project } = await supabase
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (project && project.creator_id.toLowerCase() === userId.toLowerCase()) {
    throw new Error("Project creators cannot leave their own project. Delete the project instead.");
  }

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error leaving project:", error);
    throw new Error(error.message);
  }

  return true;
}

// Public functions (no auth required)
export async function fetchPublicProjects(
  statusFilter?: ProjectStatus
): Promise<Project[]> {
  let query = supabase
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: projects, error } = await query;

  if (error) {
    console.error("Error fetching public projects:", error);
    return [];
  }

  // Get member counts for all projects
  const projectIds = (projects || []).map((p) => p.id);

  const { data: allMembers } = await supabase
    .from("project_members")
    .select("*")
    .in("project_id", projectIds);

  // Fetch creator profiles
  const creatorIds = [...new Set((projects || []).map((p) => p.creator_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of creatorIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  return (projects || []).map((project) => {
    const projectMembers = (allMembers || []).filter(
      (m) => m.project_id === project.id
    );

    return {
      ...project,
      creator: profiles[project.creator_id] || null,
      member_count: projectMembers.length,
      user_is_member: false,
    };
  });
}

export async function fetchPublicProject(
  projectId: string
): Promise<Project | null> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("is_public", true)
    .single();

  if (error) {
    console.error("Error fetching public project:", error);
    return null;
  }

  // Fetch members
  const { data: members } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId)
    .order("joined_at", { ascending: true });

  // Fetch profiles for all members
  const memberUserIds = [...new Set((members || []).map((m) => m.user_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of memberUserIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  // Fetch creator profile
  const creator = await getProfile(project.creator_id);

  const membersWithProfiles: ProjectMember[] = (members || []).map((m) => ({
    ...m,
    user: profiles[m.user_id] || null,
  }));

  return {
    ...project,
    creator,
    members: membersWithProfiles,
    member_count: membersWithProfiles.length,
    user_is_member: false,
  };
}

