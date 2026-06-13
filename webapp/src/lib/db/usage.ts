import "server-only";

import { getApiBaseUrl, authHeaders } from "../fetch";

export type UsageLimits = {
  itemCount: number;
  itemLimit: number;
  collectionCount: number;
  collectionLimit: number;
  isPro: boolean;
  itemsRemaining: number | null;
  collectionsRemaining: number | null;
  canCreateItem: boolean;
  canCreateCollection: boolean;
};

type FetchOptions = {
  accessToken?: string;
};

export async function getUsageLimits(options?: FetchOptions): Promise<UsageLimits> {
  const response = await fetch(`${getApiBaseUrl()}/api/usage/limits`, {
    cache: "no-store",
    headers: authHeaders(options?.accessToken),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch usage limits: ${response.status}`);
  }

  return response.json() as Promise<UsageLimits>;
}
