import "server-only";

import { fetchWithRetry, getApiBaseUrl, authHeaders } from "@/lib/fetch";
import type { FetchOptions } from "@/lib/fetch";
import type { PagedResult } from "@/lib/db/items";
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
  options?: FetchOptions & { page?: number; pageSize?: number },
): Promise<PagedResult<DashboardRecentCollection>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 5;
  const response = await fetchDashboardCollections(
    `/api/dashboard/collections?page=${page}&pageSize=${pageSize}`,
    options,
  );
  return response;
}

async function fetchDashboardCollections(
  path: string,
  options?: FetchOptions,
): Promise<PagedResult<DashboardRecentCollection>> {
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

  const payload = (await response.json()) as {
    items: DashboardRecentCollectionApiDto[];
    totalCount: number;
    page: number;
    pageSize: number;
  };

  return {
    items: payload.items.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description ?? "",
      itemCount: collection.itemCount,
      lastUpdatedAt: toDateLabel(collection.lastUpdatedAt),
      dominantColor: collection.dominantColor,
      isFavorite: collection.isFavorite,
      typeIcons: [...new Set(collection.typeIcons.map(normalizeIconName))],
    })),
    totalCount: payload.totalCount,
    page: payload.page,
    pageSize: payload.pageSize,
  };
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
    `${getApiBaseUrl()}/api/dashboard/collections?page=1&pageSize=500`,
    { cache: "no-store", headers: authHeaders(options?.accessToken) },
  );
  if (!response.ok) throw new Error(`Failed to fetch collections: ${response.status}`);
  const payload = (await response.json()) as { items: { id: string; name: string }[] };
  return payload.items.map((c) => ({ id: c.id, name: c.name }));
}

export async function updateCollection(
  id: string,
  data: { name: string; description?: string | null },
  options?: FetchOptions,
): Promise<CreatedCollection> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/collections/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(options?.accessToken),
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    let message = `Failed to update collection: ${response.status}`;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.error === "string") message = parsed.error;
    } catch { /* keep default */ }
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

export async function deleteCollection(
  id: string,
  options?: FetchOptions,
): Promise<void> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/collections/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete collection: ${response.status}`);
  }
}
