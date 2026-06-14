"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { getClient, AI_MODEL } from "@/lib/ai";
import { checkAIRateLimit } from "@/lib/ai-rate-limit";

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().nullable().optional(),
});

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}

export async function generateAutoTags(
  raw: { title: string; content?: string | null },
): Promise<ActionResult<string[]>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI tag suggestions are a Pro feature" };
  }

  const parsed = generateAutoTagsSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const { title, content } = parsed.data;

  const rateLimit = checkAIRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const truncatedContent = content ? content.slice(0, 2000) : "";

  try {
    const client = getClient();

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a tagging assistant for a developer's code snippet library. Given an item's title (and optionally its content), suggest 3-5 lowercase freeform tags. Even if only the title is given, extract keywords and infer tags from it. You must respond with a valid JSON array of strings and nothing else.",
      input: content
        ? `Title: ${title}\nContent: ${truncatedContent}\n\nProvide 3-5 tags as a JSON array only.`
        : `Title: ${title}\n\nThis item has no content yet. Based on the title, provide 3-5 tags as a JSON array only.`,
    });

    const text = response.output_text;
    if (!text) {
      return { success: false, error: "AI returned an empty response" };
    }

    let parsed: unknown;
    // Try direct JSON parse first
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code block
      const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (codeBlock?.[1]) {
        try {
          parsed = JSON.parse(codeBlock[1].trim());
        } catch {
          // Try extracting a JSON array from the text
          const arrayMatch = text.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            try {
              parsed = JSON.parse(arrayMatch[0]);
            } catch {
              return { success: false, error: "Failed to parse AI response" };
            }
          } else {
            return { success: false, error: "Failed to parse AI response" };
          }
        }
      } else {
        // Try extracting a JSON array from the text
        const arrayMatch = text.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            parsed = JSON.parse(arrayMatch[0]);
          } catch {
            return { success: false, error: "Failed to parse AI response" };
          }
        } else {
          return { success: false, error: "Failed to parse AI response" };
        }
      }
    }

    let tags: string[];
    if (Array.isArray(parsed)) {
      tags = parsed.filter((t): t is string => typeof t === "string");
    } else if (parsed !== null && typeof parsed === "object" && "tags" in parsed) {
      const candidate = (parsed as Record<string, unknown>).tags;
      tags = Array.isArray(candidate)
        ? candidate.filter((t): t is string => typeof t === "string")
        : [];
    } else {
      tags = [];
    }

    const normalized = [...new Set(tags.map(normalizeTag).filter((t) => t.length > 0))];

    if (normalized.length === 0) {
      return { success: false, error: "No valid tags returned by AI" };
    }

    return { success: true, data: normalized.slice(0, 5) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}
