const GOOGLE_API_KEY =
  process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? null;

const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL?.trim() ?? "gemini-2.5-flash-image";

const GEMINI_IMAGE_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent`;

export async function generateNanoBananaImage(prompt: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> {
  if (!GOOGLE_API_KEY) {
    console.info(
      "[gemini-image] Missing GOOGLE_API_KEY. Skipping fallback image generation."
    );
    return null;
  }

  try {
    const response = await fetch(
      `${GEMINI_IMAGE_ENDPOINT}?key=${encodeURIComponent(GOOGLE_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Gemini image API responded with ${response.status}: ${text}`
      );
    }

    const json = (await response.json()) as any;
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part: any) => part.inlineData);

    if (!imagePart) {
      console.warn("[gemini-image] No inlineData image in response.");
      return null;
    }

    const base64 = imagePart.inlineData.data as string;
    const contentType =
      imagePart.inlineData.mimeType?.toString() || "image/png";

    return {
      buffer: Buffer.from(base64, "base64"),
      contentType,
    };
  } catch (error) {
    console.error("[gemini-image] Failed to generate image", error);
    return null;
  }
}
