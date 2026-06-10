import "server-only";

import { fetchWithRetry, getApiBaseUrl, authHeaders } from "@/lib/fetch";
import type { FetchOptions } from "@/lib/fetch";
import type { CollectionForSelect } from "@/types/items";

export type CreateCollectionPayload = {
  name: string;
  description?: string | null;
  isFavorite?: boolean;
};

export type CreatedCollection = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
};

export type DashboardRecentCollection = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  lastUpdatedAt: string | null;
  dominantColor: string;
  isFavorite: boolean;
  typeIcons: string[];
};

type DashboardRecentCollectionApiDto = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  lastUpdatedAt: string;
  dominantColor: string;
  isFavorite: boolean;
  typeIcons: string[];
};

function normalizeIconName(value: string) {
  const lowered = value.trim().toLowerCase();

  switch (lowered) {
    case "code":
    case "code2":
      return "code";
    case "sparkles":
      return "sparkles";
    case "terminal":
      return "terminal";
    case "stickynote":
    case "filetext":
    case "file-text":
      return "file-text";
    case "file":
      return "file";
    case "image":
    case "fileimage":
      return "image";
    case "link":
    case "link2":
      return "link";
    default:
      return "file-text";
  }
}

function toDateLabel(value: string) {
  return value.slice(0, 10);
}

export async function getDashboardCollections(
  limit = 100,
  options?: FetchOptions,
): Promise<DashboardRecentCollection[]> {
  const response = await fetchDashboardCollections(
    `/api/dashboard/collections?limit=${limit}`,
    options,
  );

  return response;
}

async function fetchDashboardCollections(
  path: string,
  options?: FetchOptions,
): Promise<DashboardRecentCollection[]> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}${path}`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch dashboard collections: ${response.status}`,
    );
  }

  const payload = (await response.json()) as DashboardRecentCollectionApiDto[];

  return payload.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description ?? "",
    itemCount: collection.itemCount,
    lastUpdatedAt: toDateLabel(collection.lastUpdatedAt),
    dominantColor: collection.dominantColor,
    isFavorite: collection.isFavorite,
    typeIcons: [...new Set(collection.typeIcons.map(normalizeIconName))],
  }));
}

type CollectionApiDto = {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: string;
};

export async function createCollection(
  data: CreateCollectionPayload,
  options?: FetchOptions,
): Promise<CreatedCollection> {
  const response = await fetchWithRetry(`${getApiBaseUrl()}/api/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options?.accessToken),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const body = await response.text();
    let message = `Failed to create collection: ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.error === "string") message = parsed.error;
    } catch { /* keep default message */ }
    throw new Error(message);
  }

  const payload = (await response.json()) as CollectionApiDto;

  return {
    id: payload.id,
    name: payload.name,
    description: payload.description,
    isFavorite: payload.isFavorite,
    createdAt: payload.createdAt,
  };
}

export async function getCollectionsForSelect(
  options?: FetchOptions,
): Promise<CollectionForSelect[]> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/dashboard/collections?limit=500`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch collections for select: ${response.status}`);
  }

  const payload = (await response.json()) as {
    id: string;
    name: string;
  }[];

  return payload.map((c) => ({ id: c.id, name: c.name }));
}
