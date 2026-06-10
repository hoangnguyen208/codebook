import "server-only";

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("enotfound") ||
    msg.includes("fetch failed") ||
    msg.includes("network error") ||
    msg.includes("connection refused") ||
    msg.includes("getaddrinfo")
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init);
      return response;
    } catch (error) {
      if (attempt >= retries || !isConnectionError(error)) {
        throw error;
      }
      const waitMs = BASE_DELAY_MS * Math.pow(2, attempt);
      console.warn(
        `[fetchWithRetry] attempt ${attempt + 1}/${retries + 1} failed, retrying in ${waitMs}ms: ${url}`,
      );
      await delay(waitMs);
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}

export type FetchOptions = {
  accessToken?: string;
};

export function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

export function authHeaders(accessToken?: string): Record<string, string> {
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
}
