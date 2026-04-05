import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProject, joinProject, leaveProject } from "@n3q/shared";
import type { ProjectStatus } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { formatDistanceToNow } from "@n3q/shared";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  looking_for_help: "Looking for Help",
  completed: "Completed",
};

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const queryClient = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject(supabase, id, userId!),
    enabled: !!userId,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinProject(supabase, id, userId!),
    onSuccess: () => {
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

  if (!project) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isCreator = project.creator_id.toLowerCase() === userId?.toLowerCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{STATUS_LABELS[project.status]}</Text>
        </View>
      </View>

      <Text style={styles.title}>{project.title}</Text>

      {project.description && (
        <Text style={styles.description}>{project.description}</Text>
      )}

      <Text style={styles.meta}>
        {formatDistanceToNow(new Date(project.created_at))}
        {project.creator && ` by ${project.creator.display_name || `${project.creator_id.slice(0, 6)}...`}`}
      </Text>

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

      {project.members && project.members.length > 0 && (
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>
            Members ({project.member_count})
          </Text>
          {project.members.map((member) => (
            <View key={member.id} style={styles.memberRow}>
              <Text style={styles.memberName}>
                {member.user?.display_name || "Anonymous"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  badgeRow: { marginBottom: 12 },
  badge: { backgroundColor: colors.amberMuted, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.amberBorder, alignSelf: "flex-start" },
  badgeText: { color: colors.amber, fontSize: 10, fontWeight: "600" },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", marginBottom: 8 },
  description: { color: colors.foreground, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginBottom: 4 },
  button: {
    backgroundColor: "#FFA236",
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { fontFamily: "DepartureMono", fontSize: 16, color: "#171717", letterSpacing: 1 },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  buttonTextSecondary: { color: colors.mutedForeground },
  membersSection: { marginTop: 24 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  memberRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  memberName: { color: colors.foreground, fontSize: 14 },
});
