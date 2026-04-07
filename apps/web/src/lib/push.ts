import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushToAll(title: string, body: string, data?: Record<string, unknown>) {
  const client = createSupabaseServiceClient();
  if (!client) return;

  const { data: tokens } = await client
    .from("push_tokens")
    .select("token");

  if (!tokens || tokens.length === 0) return;

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
  }));

  // Expo Push API accepts batches of up to 100
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    }).catch((err) => console.error("[push] Error sending batch:", err));
  }
}

export async function sendPushToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
  const client = createSupabaseServiceClient();
  if (!client) return;

  const { data: tokens } = await client
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId);

  if (!tokens || tokens.length === 0) return;

  const messages: PushMessage[] = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  }).catch((err) => console.error("[push] Error sending to user:", err));
}
