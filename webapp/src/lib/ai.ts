import "server-only";
import OpenAI from "openai";

export const AI_MODEL = "gpt-5-nano";

function getOpenAIClient(): OpenAI {
  if (!process.env.OPEN_API_KEY) {
    throw new Error("OPEN_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPEN_API_KEY });
}

let client: OpenAI | null = null;

export function getClient(): OpenAI {
  if (!client) {
    client = getOpenAIClient();
  }
  return client;
}
