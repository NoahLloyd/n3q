export interface LinkMetadata {
  /** Original URL submitted by the user */
  url: string;
  /** Final URL after following redirects (falls back to the original if unchanged) */
  resolvedUrl: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  hostname: string;
}

function extractMetaTag(content: string, attribute: "property" | "name", value: string) {
  const regex = new RegExp(
    `<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const match = content.match(regex);
  return match?.[1]?.trim() ?? null;
}

function extractTitle(content: string) {
  const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() ?? null;
}

function absolutizeUrl(candidate: string | null, base: string) {
  if (!candidate) return null;
  try {
    return new URL(candidate, base).toString();
  } catch {
    return candidate;
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const response = await fetch(url, { redirect: "follow" });
  const html = await response.text();

  const resolvedUrl = response.url || url;
  const siteName =
    extractMetaTag(html, "property", "og:site_name") ??
    extractMetaTag(html, "name", "application-name");
  const title =
    extractMetaTag(html, "property", "og:title") ??
    extractMetaTag(html, "name", "twitter:title") ??
    extractTitle(html);
  const description =
    extractMetaTag(html, "property", "og:description") ??
    extractMetaTag(html, "name", "description");
  const image = extractMetaTag(html, "property", "og:image");
  const author =
    extractMetaTag(html, "property", "article:author") ??
    extractMetaTag(html, "name", "author");

  const hostname = new URL(resolvedUrl).hostname;

  return {
    url,
    resolvedUrl,
    title: title ?? null,
    description: description ?? null,
    image: absolutizeUrl(image, resolvedUrl),
    siteName: siteName ?? null,
    author: author ?? null,
    hostname,
  };
}


