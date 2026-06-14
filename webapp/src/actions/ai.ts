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
    try {
      parsed = JSON.parse(text);
    } catch {
      const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
      if (codeBlock?.[1]) {
        try {
          parsed = JSON.parse(codeBlock[1].trim());
        } catch {
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

const generateDescriptionSchema = z.object({
  title: z.string().trim().optional().or(z.literal("")),
  content: z.string().trim().nullable().optional(),
  typeName: z.string().trim().nullable().optional(),
  language: z.string().trim().nullable().optional(),
  url: z.string().trim().nullable().optional(),
});

export async function generateDescription(
  raw: {
    title?: string | null;
    content?: string | null;
    typeName?: string | null;
    language?: string | null;
    url?: string | null;
  },
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI description generation is a Pro feature" };
  }

  const parsed = generateDescriptionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const { title, content, typeName, language, url } = parsed.data;

  const rateLimit = checkAIRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (typeName) parts.push(`Type: ${typeName}`);
  if (language) parts.push(`Language: ${language}`);
  if (url) parts.push(`URL: ${url}`);
  if (content) parts.push(`Content: ${content.slice(0, 2000)}`);

  if (parts.length === 0) {
    return { success: false, error: "Provide at least a title or content to generate a description" };
  }

  try {
    const client = getClient();

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a helpful assistant for a developer's code snippet library. Write a concise 1-2 sentence description summarizing what an item is about based on the available information. Be specific and informative. Return ONLY the description text with no additional commentary, formatting, or labels.",
      input: `Write a short 1-2 sentence description for this item:\n${parts.join("\n")}`,
    });

    const text = response.output_text;
    if (!text) {
      return { success: false, error: "AI returned an empty response" };
    }

    const cleaned = text.trim().replace(/^"+|"+$/g, "").trim();

    return { success: true, data: cleaned };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}

const explainCodeSchema = z.object({
  code: z.string().trim().min(1),
  language: z.string().trim().nullable().optional(),
  typeName: z.string().trim().min(1),
});

export async function explainCode(
  raw: {
    code: string;
    language?: string | null;
    typeName: string;
  },
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  if (!session.user.isPro) {
    return { success: false, error: "AI code explanation is a Pro feature" };
  }

  const parsed = explainCodeSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const { code, language, typeName } = parsed.data;

  const rateLimit = checkAIRateLimit(session.user.id);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }

  const truncatedCode = code.slice(0, 2000);

  const typeLabel = typeName === "command" ? "terminal command" : "code snippet";
  const langHint = language ? `\nLanguage: ${language}` : "";

  try {
    const client = getClient();

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        "You are a code explanation assistant for a developer's snippet library. Explain the provided code concisely in 200-300 words using markdown formatting. Cover what the code does, key concepts, patterns, and notable functions or techniques. Be informative but concise. Return ONLY the markdown explanation with no preamble or labels.",
      input: `Explain this ${typeLabel}:${langHint}\n\nCode:\n${truncatedCode}`,
    });

    const text = response.output_text;
    if (!text) {
      return { success: false, error: "AI returned an empty response" };
    }

    return { success: true, data: text.trim() };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI service unavailable",
    };
  }
}
