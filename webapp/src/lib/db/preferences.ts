import { fetchWithRetry, getApiBaseUrl, authHeaders } from "@/lib/fetch";
import type { FetchOptions } from "@/lib/fetch";

export type EditorPreferences = {
  fontSize?: number;
  tabSize?: number;
  wordWrap?: boolean;
  minimap?: boolean;
  theme?: string;
};

export async function getPreferences(
  options?: FetchOptions,
): Promise<EditorPreferences> {
  const res = await fetchWithRetry(
    `${getApiBaseUrl()}/api/preferences`,
    { cache: "no-store", headers: authHeaders(options?.accessToken) },
  );
  if (!res.ok) return {};
  const payload = (await res.json()) as { preferences: EditorPreferences };
  return payload.preferences ?? {};
}

export async function updatePreferences(
  preferences: EditorPreferences,
  options?: FetchOptions,
): Promise<EditorPreferences> {
  const res = await fetchWithRetry(
    `${getApiBaseUrl()}/api/preferences`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders(options?.accessToken) },
      body: JSON.stringify({ preferences }),
    },
  );
  if (!res.ok) throw new Error(`Failed to save preferences: ${res.status}`);
  const payload = (await res.json()) as { preferences: EditorPreferences };
  return payload.preferences ?? {};
}
