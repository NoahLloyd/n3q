import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter, Stack } from "expo-router";
import { useAuth } from "@/src/lib/auth/context";

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/");
        },
      },
    ]);
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "N3";

  return (
    <>
      <Stack.Screen options={{ title: "Profile", headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.display_name || "Anonymous"}</Text>
          {profile?.email && <Text style={styles.email}>{profile.email}</Text>}
        </View>

        {profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.sectionText}>{profile.bio}</Text>
          </View>
        )}

        {profile?.wallet_address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            <Text style={styles.wallet} numberOfLines={1}>{profile.wallet_address}</Text>
          </View>
        )}

        {profile?.created_at && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Member Since</Text>
            <Text style={styles.sectionText}>
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20 },
  header: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 16 },
  avatarPlaceholder: { backgroundColor: "#2a2a2a", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#f5a623", fontSize: 36, fontWeight: "bold" },
  name: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  email: { color: "#888", fontSize: 14, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { color: "#888", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  sectionText: { color: "#ccc", fontSize: 14, lineHeight: 21 },
  wallet: { color: "#aaa", fontSize: 13, fontFamily: "SpaceMono" },
  signOutButton: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  signOutText: { color: "#f87171", fontSize: 15, fontWeight: "600" },
});
