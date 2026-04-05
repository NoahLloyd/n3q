import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push";

export async function POST(request: Request) {
  let body: { type: string; title: string; body: string; data?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, body: message, data } = body;
  if (!title || !message) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  await sendPushToAll(title, message, data);

  return NextResponse.json({ sent: true });
}
