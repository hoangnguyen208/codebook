import "server-only";

import { fetchWithRetry, getApiBaseUrl, authHeaders } from "@/lib/fetch";
import type { FetchOptions } from "@/lib/fetch";
import type { DashboardItem } from "@/types/items";
import type { DashboardRecentCollection } from "@/lib/db/collections";

type DashboardItemApiDto = {
  id: string;
  title: string;
  description: string | null;
  content?: string | null;
  url?: string | null;
  typeId: string;
  collectionIds: string[];
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
  createdAt: string;
};

type RecentDashboardCollectionApiDto = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  lastUpdatedAt: string;
  dominantColor: string;
  isFavorite: boolean;
  typeIcons: string[];
};

type FavoritesDto = {
  items: DashboardItemApiDto[];
  collections: RecentDashboardCollectionApiDto[];
};

function toDateLabel(value: string) {
  return value.slice(0, 10);
}

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

export type FavoritesResult = {
  items: DashboardItem[];
  collections: DashboardRecentCollection[];
};

export async function getFavorites(options?: FetchOptions): Promise<FavoritesResult> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/dashboard/favorites`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch favorites: ${response.status}`);
  }

  const payload = (await response.json()) as FavoritesDto;

  return {
    items: payload.items.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description ?? "",
      content: item.content ?? null,
      url: item.url ?? null,
      typeId: item.typeId,
      collectionIds: item.collectionIds ?? [],
      fileUrl: item.fileUrl ?? null,
      fileName: item.fileName ?? null,
      fileSize: item.fileSize ?? null,
      tags: item.tags.filter((tag) => tag.trim().length > 0),
      isFavorite: item.isFavorite,
      isPinned: item.isPinned,
      updatedAt: toDateLabel(item.updatedAt),
      createdAt: toDateLabel(item.createdAt),
    })),
    collections: payload.collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description ?? "",
      itemCount: c.itemCount,
      lastUpdatedAt: toDateLabel(c.lastUpdatedAt),
      dominantColor: c.dominantColor,
      isFavorite: c.isFavorite,
      typeIcons: [...new Set(c.typeIcons.map(normalizeIconName))],
    })),
  };
}
