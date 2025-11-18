import { NextResponse } from "next/server";

function extractMeta(content: string, property: string): string | null {
  const ogRegex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = content.match(ogRegex);
  return match?.[1] ?? null;
}

function extractName(content: string): string | null {
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1] ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();

    const title =
      extractMeta(html, "og:title") ?? extractName(html) ?? null;
    const description =
      extractMeta(html, "og:description") ?? null;
    const image = extractMeta(html, "og:image");

    const hostname = new URL(url).hostname;

    return NextResponse.json({
      url,
      title,
      description,
      image: image ?? null,
      hostname,
    });
  } catch (error) {
    console.error("Error fetching link preview", error);
    return NextResponse.json(
      { url, title: null, description: null, image: null },
      { status: 200 },
    );
  }
}


