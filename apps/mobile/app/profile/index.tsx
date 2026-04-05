import { View, Text, ScrollView, Image, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";

function PixelArrow() {
  return (
    <Svg width={14} height={10} viewBox="0 0 88 63">
      <Path d="M0 24.9697H12.4848V12.4848H24.9697V24.9697H87.3939V37.4545H24.9697V49.9394H12.4848V37.4545H0V24.9697ZM24.9697 0H37.4545V12.4848H24.9697V0ZM24.9697 49.9394H37.4545V62.4242H24.9697V49.9394Z" fill="#6A6B60" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;

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
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerTitle: () => (
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <PixelArrow />
                <Text style={styles.backText}>back</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={{ width: 60 }} />
            </View>
          ),
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12 }]}>
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

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerTitle: {
    color: "#f5a623",
    fontSize: 18,
    fontFamily: "DepartureMono",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontFamily: "DepartureMono",
    fontSize: 14,
    color: "#6A6B60",
  },
  header: { alignItems: "center", marginBottom: 32, marginTop: 12 },
  avatar: { width: 72, height: 72, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  avatarPlaceholder: { backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#f5a623", fontSize: 28, fontWeight: "bold" },
  name: { color: colors.foreground, fontSize: 20, fontWeight: "600" },
  email: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  sectionText: { color: colors.foreground, fontSize: 14, lineHeight: 21 },
  wallet: { color: colors.mutedForeground, fontSize: 13, fontFamily: "SpaceMono" },
  signOutButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  signOutText: { color: "#f87171", fontSize: 14, fontFamily: "DepartureMono", letterSpacing: 1 },
});
