import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProject, joinProject, leaveProject, deleteProject, updateProject } from "@n3q/shared";
import type { ProjectStatus } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import * as Haptics from "expo-haptics";
import { colors } from "@/src/lib/theme";
import { formatDistanceToNow } from "@n3q/shared";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  looking_for_help: "Looking for Help",
  completed: "Completed",
};

const STATUS_ORDER: ProjectStatus[] = ["idea", "in_progress", "looking_for_help", "completed"];

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(supabase, id, userId!),
    enabled: !!userId,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinProject(supabase, id, userId!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: () => leaveProject(supabase, id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(supabase, id, userId!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.back();
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  const descriptionMutation = useMutation({
    mutationFn: (description: string) => updateProject(supabase, id, userId!, { description: description.trim() || null }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => updateProject(supabase, id, userId!, { status }),
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isCreator = project.creator_id.toLowerCase() === userId?.toLowerCase();

  function handleDelete() {
    Alert.alert("Delete Project", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  }

  function handleStatusChange() {
    Alert.alert(
      "Change Status",
      undefined,
      [
        ...STATUS_ORDER.map((s) => ({
          text: `${STATUS_LABELS[s]}${s === project!.status ? " ✓" : ""}`,
          onPress: () => { if (s !== project!.status) statusMutation.mutate(s); },
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
      {/* Status badge — tappable for creator */}
      <View style={styles.badgeRow}>
        <Pressable onPress={isCreator ? handleStatusChange : undefined} disabled={!isCreator}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {STATUS_LABELS[project.status]}{isCreator ? " ▾" : ""}
            </Text>
          </View>
        </Pressable>
        {project.is_public && (
          <View style={styles.publicBadge}>
            <Text style={styles.publicBadgeText}>Public</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{project.title}</Text>

      {/* Description — editable for creator */}
      {isEditing ? (
        <View style={styles.editSection}>
          <TextInput
            style={styles.editInput}
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            autoFocus
            placeholder="Describe the project..."
            placeholderTextColor="#555"
            textAlignVertical="top"
          />
          <View style={styles.editActions}>
            <Pressable
              style={styles.editCancel}
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.editCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={styles.editSave}
              onPress={() => descriptionMutation.mutate(editDescription)}
              disabled={descriptionMutation.isPending}
            >
              <Text style={styles.editSaveText}>
                {descriptionMutation.isPending ? "Saving..." : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={isCreator ? () => { setEditDescription(project.description || ""); setIsEditing(true); } : undefined}
          disabled={!isCreator}
        >
          {project.description ? (
            <Text style={styles.description}>{project.description}</Text>
          ) : isCreator ? (
            <Text style={styles.addDescription}>Tap to add a description...</Text>
          ) : null}
        </Pressable>
      )}

      <Text style={styles.meta}>
        {formatDistanceToNow(new Date(project.created_at))}
        {project.creator && ` by ${project.creator.display_name || `${project.creator_id.slice(0, 6)}...`}`}
      </Text>

      {/* Actions */}
      {!isCreator && (
        <Pressable
          style={[styles.button, project.user_is_member && styles.buttonSecondary]}
          onPress={() => {
            if (project.user_is_member) {
              leaveMutation.mutate();
            } else {
              joinMutation.mutate();
            }
          }}
          disabled={joinMutation.isPending || leaveMutation.isPending}
        >
          <Text style={[styles.buttonText, project.user_is_member && styles.buttonTextSecondary]}>
            {project.user_is_member ? "Leave Project" : "Join Project"}
          </Text>
        </Pressable>
      )}

      {isCreator && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Project</Text>
        </Pressable>
      )}

      {/* Members */}
      {project.members && project.members.length > 0 && (
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Members ({project.member_count})
          </Text>
          {project.members.map((member) => {
            const isMemberCreator = member.user_id.toLowerCase() === project.creator_id.toLowerCase();
            return (
              <View key={member.id} style={styles.memberRow}>
                <Text style={styles.memberName}>
                  {member.user?.display_name || "Anonymous"}
                </Text>
                <Text style={styles.memberMeta}>
                  {isMemberCreator ? "Creator" : `Joined ${formatDistanceToNow(new Date(member.joined_at))}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  badge: { backgroundColor: colors.amberMuted, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.amberBorder },
  badgeText: { color: colors.amber, fontSize: 11, fontWeight: "600" },
  publicBadge: { backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.cardBorder },
  publicBadgeText: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600" },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", marginBottom: 8 },
  description: { color: colors.foreground, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  addDescription: { color: colors.mutedForeground, fontSize: 14, fontStyle: "italic", marginBottom: 12 },
  editSection: { marginBottom: 12 },
  editInput: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 12, color: colors.foreground, fontSize: 14, lineHeight: 21, minHeight: 120, textAlignVertical: "top" },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  editCancel: { padding: 8 },
  editCancelText: { fontFamily: "DepartureMono", fontSize: 13, color: colors.mutedForeground },
  editSave: { backgroundColor: "#FFA236", paddingHorizontal: 16, paddingVertical: 8 },
  editSaveText: { fontFamily: "DepartureMono", fontSize: 13, color: "#171717" },
  meta: { color: colors.mutedForeground, fontSize: 12, marginBottom: 4 },
  button: { backgroundColor: "#FFA236", padding: 14, alignItems: "center", marginTop: 24 },
  buttonText: { fontFamily: "DepartureMono", fontSize: 16, color: "#171717", letterSpacing: 1 },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
  buttonTextSecondary: { color: colors.mutedForeground },
  deleteButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, alignItems: "center", marginTop: 16 },
  deleteButtonText: { fontFamily: "DepartureMono", fontSize: 14, color: "#f87171", letterSpacing: 1 },
  membersSection: { marginTop: 24 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  memberRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  memberName: { color: colors.foreground, fontSize: 14, fontWeight: "500" },
  memberMeta: { color: colors.mutedForeground, fontSize: 11, marginTop: 2 },
});
