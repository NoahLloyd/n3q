import { NextResponse } from "next/server";
import { fetchLinkMetadata } from "@/lib/link-metadata";

const safeHostname = (value: string) => {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
}
};

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
    const metadata = await fetchLinkMetadata(url);

    return NextResponse.json({
      url: metadata.url,
      resolvedUrl: metadata.resolvedUrl,
      title: metadata.title,
      description: metadata.description,
      image: metadata.image,
      siteName: metadata.siteName,
      author: metadata.author,
      hostname: metadata.hostname,
    });
  } catch (error) {
    console.error("Error fetching link preview", error);
    return NextResponse.json(
      {
        url,
        resolvedUrl: url,
        title: null,
        description: null,
        image: null,
        siteName: null,
        author: null,
        hostname: safeHostname(url),
      },
      { status: 200 },
    );
  }
}


