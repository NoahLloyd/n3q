import { CONTENT_TYPE_OPTIONS } from "@/lib/content-types";
import type { ContentType } from "@/lib/supabase/types";
import { fetchLinkMetadata, type LinkMetadata } from "@/lib/link-metadata";

export interface EnrichmentPayload {
  url: string;
  type: ContentType;
  title: string;
  ai_title: string | null;
  ai_subtitle: string | null;
  site_name: string | null;
  author: string | null;
  description: string | null;
  image_url: string | null;
  summary: string | null;
  topics: string[];
  ai_notes: Record<string, unknown> | null;
}

interface SharedKnowledgeAgentResult {
  summary: string | null;
  topics: string[];
  aiTitle: string | null;
  aiSubtitle: string | null;
  contentType: ContentType | null;
  imagePrompt: string | null;
  raw?: Record<string, unknown>;
}

const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
const perplexityModel = process.env.PERPLEXITY_MODEL ?? "sonar";
const perplexityEndpoint = "https://api.perplexity.ai/chat/completions";

let hasLoggedStubWarning = false;

export async function runSharedKnowledgeAgent({
  url,
  metadata,
}: {
  url: string;
  metadata: LinkMetadata;
}): Promise<SharedKnowledgeAgentResult> {
  if (!perplexityApiKey) {
    return runStubAgent({ url, metadata }, { reason: "missing_api_key" });
  }

  try {
    const result = await callPerplexityAgent({ url, metadata });
    if (result.summary || result.topics.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Perplexity agent failed, falling back to stub", error);
  }

  return runStubAgent({ url, metadata }, { reason: "fallback_after_error" });
}

async function callPerplexityAgent({
  url,
  metadata,
}: {
  url: string;
  metadata: LinkMetadata;
}): Promise<SharedKnowledgeAgentResult> {
  const allowedTypesSentence = CONTENT_TYPE_OPTIONS.join(", ");

  const body = {
    model: perplexityModel,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          `You help members of the Nine Three Quarters collective understand new resources and craft beautiful hero prompts. Respond ONLY with compact JSON using these keys:
{
  "summary": string | null (<=80 words, tailored to ambitious builders),
  "topics": string[] (<=6 concise, lowercase tags),
  "title": string | null (the clearest, reference-friendly title),
  "subtitle": string | null (short hook or key insight),
  "content_type": string | null (one of: ${allowedTypesSentence}),
  "image_prompt": string | null (instructions for an ultra-wide ~3:1 hero image that features the EXACT title rendered as massive, centered lettering filling most of the canvas, surrounded by symbolic visuals relevant to the content, no other text, describe palette, lighting, and supporting motifs).
}
If something is unknown, set it to null. Never include extra commentary.`,
      },
      {
        role: "user",
        content: [
          `URL: ${metadata.resolvedUrl || url}`,
          metadata.title ? `Title: ${metadata.title}` : null,
          metadata.description ? `Description: ${metadata.description}` : null,
          metadata.siteName ? `Site: ${metadata.siteName}` : null,
          metadata.author ? `Author: ${metadata.author}` : null,
          `Hostname: ${metadata.hostname}`,
          "Provide a concise overview and tags that capture why this link matters to ambitious builders.",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    ],
  };

  const response = await fetch(perplexityEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${perplexityApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Perplexity API responded with ${response.status}: ${errorText}`,
    );
  }

  const json = (await response.json()) as {
    model?: string;
    usage?: Record<string, unknown>;
    choices?: Array<{ message?: { content?: string } }>;
  };

  const rawContent = json.choices?.[0]?.message?.content ?? null;
  const parsed = parseAgentJson(rawContent);

  const summary =
    typeof parsed?.summary === "string"
      ? parsed.summary.trim()
      : rawContent?.trim() ?? null;

  const topicsSource = Array.isArray(parsed?.topics)
    ? parsed?.topics
    : deriveTopics(summary ?? metadata.title ?? metadata.hostname ?? url);

  const topics = sanitizeTopics(topicsSource);

  const aiTitle =
    typeof parsed?.title === "string" && parsed.title.trim().length > 0
      ? parsed.title.trim()
      : null;

  const aiSubtitle =
    typeof parsed?.subtitle === "string" && parsed.subtitle.trim().length > 0
      ? parsed.subtitle.trim()
      : null;

  const contentType = normalizeContentType(parsed?.content_type);

  const imagePrompt =
    typeof parsed?.image_prompt === "string" &&
    parsed.image_prompt.trim().length > 0
      ? parsed.image_prompt.trim()
      : null;

  return {
    summary: summary || null,
    topics,
    aiTitle,
    aiSubtitle,
    contentType,
    imagePrompt,
    raw: {
      provider: "perplexity",
      model: json.model ?? perplexityModel,
      usage: json.usage ?? null,
      response: parsed ?? rawContent,
    },
  };
}

function parseAgentJson(content: string | null | undefined) {
  if (!content) return null;
  const trimmed = content.trim();
  const stripped = trimmed.startsWith("```")
    ? trimmed.replace(/```json|```/gi, "").trim()
    : trimmed;

  try {
    return JSON.parse(stripped);
  } catch {
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sanitizeTopics(topics: string[] | string): string[] {
  const array = Array.isArray(topics) ? topics : [topics];
  return array
    .map((topic) =>
      typeof topic === "string"
        ? topic
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ")
        : "",
    )
    .filter((topic) => topic.length > 0)
    .slice(0, 6);
}

function normalizeContentType(input: unknown): ContentType | null {
  if (typeof input !== "string") return null;
  const normalized = input.trim().toLowerCase();
  return CONTENT_TYPE_OPTIONS.includes(normalized as ContentType)
    ? (normalized as ContentType)
    : null;
}

function runStubAgent(
  { url, metadata }: { url: string; metadata: LinkMetadata },
  meta?: Record<string, unknown>,
): SharedKnowledgeAgentResult {
  const runId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `stub-${Date.now()}`;

  if (!hasLoggedStubWarning) {
    console.warn(
      "Shared Knowledge agent is using the lightweight fallback. Provide a PERPLEXITY_API_KEY to enable the richer agent.",
    );
    hasLoggedStubWarning = true;
  }

  const baseText = metadata.title ?? metadata.description ?? metadata.hostname ?? url;
  const summary =
    metadata.description ??
    (baseText ? `Quick context: ${baseText}` : null);

  const topics = deriveTopics(baseText);

  return {
    summary,
    topics,
    aiTitle: metadata.title ?? metadata.hostname ?? url,
    aiSubtitle: summary,
    contentType: "article",
    imagePrompt: summary
      ? `Abstract hero illustration representing: ${summary}`
      : null,
    raw: {
      stub: true,
      runId,
      generatedAt: new Date().toISOString(),
      ...meta,
    },
  };
}

function deriveTopics(source: string | null): string[] {
  if (!source) return [];
  const keywords = source
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .map((word) => word.toLowerCase())
    .filter((word) => word.length > 3);

  const unique = Array.from(new Set(keywords));
  return unique.slice(0, 4);
}

export async function buildEnrichedContent({
  url,
  type,
}: {
  url: string;
  type: ContentType;
}): Promise<{
  payload: EnrichmentPayload;
  metadata: LinkMetadata;
  agent: SharedKnowledgeAgentResult;
}> {
  let metadata: LinkMetadata;
  try {
    metadata = await fetchLinkMetadata(url);
  } catch (error) {
    console.warn("Falling back to minimal metadata for", url, error);
    metadata = createFallbackMetadata(url);
  }

  const agent = await runSharedKnowledgeAgent({ url, metadata });

  const summary = agent.summary ?? metadata.description ?? null;
  const topics = agent.topics?.length ? agent.topics : [];
  const agentRunId = agent.raw?.runId ?? null;
  const aiTitle =
    agent.aiTitle ?? metadata.title ?? metadata.hostname ?? metadata.url;
  const aiSubtitle = agent.aiSubtitle ?? summary;

  const normalizedType =
    agent.contentType && CONTENT_TYPE_OPTIONS.includes(agent.contentType)
      ? agent.contentType
      : type;

  const payload: EnrichmentPayload = {
    url: metadata.resolvedUrl || metadata.url,
    type: normalizedType,
    title: metadata.title ?? metadata.hostname ?? metadata.url,
    ai_title: aiTitle,
    ai_subtitle: aiSubtitle,
    site_name: metadata.siteName ?? metadata.hostname ?? null,
    author: metadata.author,
    description: metadata.description,
    image_url: metadata.image,
    summary,
    topics,
    ai_notes: {
      metadata: {
        sourceHostname: metadata.hostname,
        resolvedUrl: metadata.resolvedUrl,
      },
      agentRunId,
      imagePrompt: agent.imagePrompt,
      agent: agent.raw ?? { stub: true },
    },
  };

  return { payload, metadata, agent };
}

function createFallbackMetadata(url: string): LinkMetadata {
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // keep hostname as url if parsing fails
  }

  return {
    url,
    resolvedUrl: url,
    title: hostname,
    description: null,
    image: null,
    siteName: hostname,
    author: null,
    hostname,
  };
}


