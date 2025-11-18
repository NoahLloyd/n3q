import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function getProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

export default async function ProfilePage() {
  const { user, profile } = await getProfile();

  if (!user) {
    // Protected by layout, but just in case.
    return null;
  }

  const initialDisplayName =
    profile?.display_name ??
    (user.user_metadata?.display_name as string | undefined) ??
    "";
  const initialAvatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    "";
  const initialBio = profile?.bio ?? "";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Profile
        </h1>
      </div>
      <ProfileForm
        initialDisplayName={initialDisplayName}
        initialAvatarUrl={initialAvatarUrl}
        initialBio={initialBio}
      />
    </div>
  );
}

function ProfileForm({
  initialDisplayName,
  initialAvatarUrl,
  initialBio,
}: {
  initialDisplayName: string;
  initialAvatarUrl: string;
  initialBio: string;
}) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const supabase = await createSupabaseServerClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const displayName = (formData.get("display_name") as string) ?? "";
        const avatarUrl = (formData.get("avatar_url") as string) ?? "";
        const bio = (formData.get("bio") as string) ?? "";

        await supabase.from("profiles").upsert(
          {
            id: user.id,
            display_name: displayName,
            avatar_url: avatarUrl,
            bio,
          },
          { onConflict: "id" },
        );

        revalidatePath("/app/profile");
        revalidatePath("/app");
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Public profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="display_name"
              className="text-xs font-medium text-muted-foreground"
            >
              Name
            </label>
            <Input
              id="display_name"
              name="display_name"
              defaultValue={initialDisplayName}
              placeholder="How people in the house see you"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="avatar_url"
              className="text-xs font-medium text-muted-foreground"
            >
              Avatar URL
            </label>
            <Input
              id="avatar_url"
              name="avatar_url"
              defaultValue={initialAvatarUrl}
              placeholder="https://…"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="bio"
              className="text-xs font-medium text-muted-foreground"
            >
              Bio
            </label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={initialBio}
              placeholder="1–3 lines about what you’re exploring right now."
              rows={4}
            />
          </div>
          <Button type="submit">Save</Button>
        </CardContent>
      </Card>
    </form>
  );
}


