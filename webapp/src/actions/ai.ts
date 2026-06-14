"use server";

import { z } from "zod";
import { getClient, AI_MODEL } from "@/lib/ai";
import { checkAIRateLimit } from "@/lib/ai-rate-limit";
import { requireProAuth } from "@/lib/action-auth";
import { validateOrFail } from "@/lib/action-validate";
import { wrapDbAction } from "@/lib/action-wrap";
import type { ActionResult } from "@/lib/action-result";

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().nullable().optional(),
});

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}

function checkRateLimit(userId: string): { success: false; error: string } | null {
  const rateLimit = checkAIRateLimit(userId);
  if (!rateLimit.allowed) {
    const minutes = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return {
      success: false,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  return null;
}

async function aiQuery(instructions: string, input: string): Promise<string> {
  const client = getClient();
  const response = await client.responses.create({
    model: AI_MODEL,
    instructions,
    input,
  });
  const text = response.output_text;
  if (!text) {
    throw new Error("AI returned an empty response");
  }
  return text;
}

function parseAiJsonArray(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const codeBlock = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (codeBlock?.[1]) {
      try {
        return JSON.parse(codeBlock[1].trim());
      } catch {
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            throw new Error("Failed to parse AI response");
          }
        }
        throw new Error("Failed to parse AI response");
      }
    }

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        throw new Error("Failed to parse AI response");
      }
    }

    throw new Error("Failed to parse AI response");
  }
}

function extractTags(parsed: unknown): string[] {
  if (Array.isArray(parsed)) {
    return parsed.filter((t): t is string => typeof t === "string");
  }
  if (parsed !== null && typeof parsed === "object" && "tags" in parsed) {
    const candidate = (parsed as Record<string, unknown>).tags;
    return Array.isArray(candidate)
      ? candidate.filter((t): t is string => typeof t === "string")
      : [];
  }
  return [];
}

export async function generateAutoTags(
  raw: { title: string; content?: string | null },
): Promise<ActionResult<string[]>> {
  const authResult = await requireProAuth("AI tag suggestions");
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(generateAutoTagsSchema, raw);
  if ("error" in validated) return validated;
  const { title, content } = validated;

  const rateLimitError = checkRateLimit(authResult.userId);
  if (rateLimitError) return rateLimitError;

  return wrapDbAction(async () => {
    const truncatedContent = content ? content.slice(0, 2000) : "";
    const text = await aiQuery(
      "You are a tagging assistant for a developer's code snippet library. Given an item's title (and optionally its content), suggest 3-5 lowercase freeform tags. Even if only the title is given, extract keywords and infer tags from it. You must respond with a valid JSON array of strings and nothing else.",
      content
        ? `Title: ${title}\nContent: ${truncatedContent}\n\nProvide 3-5 tags as a JSON array only.`
        : `Title: ${title}\n\nThis item has no content yet. Based on the title, provide 3-5 tags as a JSON array only.`,
    );

    const parsed = parseAiJsonArray(text);
    const tags = extractTags(parsed);
    const normalized = [...new Set(tags.map(normalizeTag).filter((t) => t.length > 0))];

    if (normalized.length === 0) {
      throw new Error("No valid tags returned by AI");
    }

    return normalized.slice(0, 5);
  }, "AI service unavailable");
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
  const authResult = await requireProAuth("AI description generation");
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(generateDescriptionSchema, raw);
  if ("error" in validated) return validated;
  const { title, content, typeName, language, url } = validated;

  const rateLimitError = checkRateLimit(authResult.userId);
  if (rateLimitError) return rateLimitError;

  const parts: string[] = [];
  if (title) parts.push(`Title: ${title}`);
  if (typeName) parts.push(`Type: ${typeName}`);
  if (language) parts.push(`Language: ${language}`);
  if (url) parts.push(`URL: ${url}`);
  if (content) parts.push(`Content: ${content.slice(0, 2000)}`);

  if (parts.length === 0) {
    return { success: false, error: "Provide at least a title or content to generate a description" };
  }

  return wrapDbAction(async () => {
    const text = await aiQuery(
      "You are a helpful assistant for a developer's code snippet library. Write a concise 1-2 sentence description summarizing what an item is about based on the available information. Be specific and informative. Return ONLY the description text with no additional commentary, formatting, or labels.",
      `Write a short 1-2 sentence description for this item:\n${parts.join("\n")}`,
    );

    return text.trim().replace(/^"+|"+$/g, "").trim();
  }, "AI service unavailable");
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
  const authResult = await requireProAuth("AI code explanation");
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(explainCodeSchema, raw);
  if ("error" in validated) return validated;
  const { code, language, typeName } = validated;

  const rateLimitError = checkRateLimit(authResult.userId);
  if (rateLimitError) return rateLimitError;

  const truncatedCode = code.slice(0, 2000);
  const typeLabel = typeName === "command" ? "terminal command" : "code snippet";
  const langHint = language ? `\nLanguage: ${language}` : "";

  return wrapDbAction(async () => {
    const text = await aiQuery(
      "You are a code explanation assistant for a developer's snippet library. Explain the provided code concisely in 200-300 words using markdown formatting. Cover what the code does, key concepts, patterns, and notable functions or techniques. Be informative but concise. Return ONLY the markdown explanation with no preamble or labels.",
      `Explain this ${typeLabel}:${langHint}\n\nCode:\n${truncatedCode}`,
    );

    return text.trim();
  }, "AI service unavailable");
}

const optimizePromptSchema = z.object({
  prompt: z.string().trim().min(1),
});

export async function optimizePrompt(
  raw: {
    prompt: string;
  },
): Promise<ActionResult<string>> {
  const authResult = await requireProAuth("AI prompt optimization");
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(optimizePromptSchema, raw);
  if ("error" in validated) return validated;
  const { prompt } = validated;

  const rateLimitError = checkRateLimit(authResult.userId);
  if (rateLimitError) return rateLimitError;

  const truncatedPrompt = prompt.slice(0, 2000);

  return wrapDbAction(async () => {
    const text = await aiQuery(
      "You are a prompt optimization assistant for a developer's AI prompt library. Take the given prompt and refine it to be clearer, more specific, and more effective. Improve structure, add specificity, clarify intent, and fix any ambiguity. Preserve the original purpose and style. Return ONLY the optimized prompt text with no preamble, labels, or explanation.",
      `Optimize the following AI prompt to be clearer and more effective:\n\n${truncatedPrompt}`,
    );

    return text.trim();
  }, "AI service unavailable");
}
