import "server-only";

import type { DashboardItem, DashboardItemType, ItemDetail } from "@/types/items";
import { fetchWithRetry, getApiBaseUrl, authHeaders } from "@/lib/fetch";
import type { FetchOptions } from "@/lib/fetch";

export type { DashboardItem, DashboardItemType, ItemDetail };

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

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

type DashboardItemTypeApiDto = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
};

function toDateLabel(value: string) {
  return value.slice(0, 10);
}

function toTypeLabel(name: string) {
  switch (name.toLowerCase()) {
    case "snippet":
      return "Snippets";
    case "prompt":
      return "Prompts";
    case "command":
      return "Commands";
    case "note":
      return "Notes";
    case "file":
      return "Files";
    case "image":
      return "Images";
    case "link":
      return "Links";
    default:
      return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
  }
}

function normalizeIconName(
  value: string | null,
): DashboardItemType["icon"] {
  const lowered = value?.trim().toLowerCase() ?? "";

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

function normalizeColorToken(name: string, color: string | null) {
  const byName: Record<string, string> = {
    snippet: "blue",
    prompt: "purple",
    command: "orange",
    note: "yellow",
    file: "slate",
    image: "pink",
    link: "emerald",
  };

  const byHex: Record<string, string> = {
    "#3b82f6": "blue",
    "#8b5cf6": "purple",
    "#f97316": "orange",
    "#fde047": "yellow",
    "#6b7280": "slate",
    "#ec4899": "pink",
    "#10b981": "emerald",
  };

  return (
    byName[name.toLowerCase()] ??
    (color ? byHex[color.toLowerCase()] : undefined) ??
    "slate"
  );
}

export async function getSystemDashboardItemTypes(options?: FetchOptions): Promise<DashboardItemType[]> {
  const response = await fetchWithRetry(`${getApiBaseUrl()}/api/dashboard/item-types/system`, {
    cache: "no-store",
    headers: authHeaders(options?.accessToken),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch dashboard system item types: ${response.status}`,
    );
  }

  const payload = (await response.json()) as DashboardItemTypeApiDto[];

  return payload.map((itemType) => ({
    id: itemType.id,
    name: itemType.name,
    label: toTypeLabel(itemType.name),
    icon: normalizeIconName(itemType.icon),
    color: normalizeColorToken(itemType.name, itemType.color),
    isSystem: itemType.isSystem,
  }));
}

export async function getRecentDashboardItems(
  limit = 100,
  options?: FetchOptions,
): Promise<DashboardItem[]> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/dashboard/items/recent?limit=${limit}`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recent dashboard items: ${response.status}`);
  }

  const payload = (await response.json()) as DashboardItemApiDto[];

  return payload.map((item) => ({
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
  }));
}

export async function getItemsByType(
  typeName: string,
  options?: FetchOptions & { page?: number; pageSize?: number },
): Promise<PagedResult<DashboardItem>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 5;
  const res = await fetchWithRetry(
    `${getApiBaseUrl()}/api/dashboard/items/by-type/${encodeURIComponent(typeName)}?page=${page}&pageSize=${pageSize}`,
    { cache: "no-store", headers: authHeaders(options?.accessToken) },
  );
  if (!res.ok) throw new Error(`Failed to fetch items by type "${typeName}": ${res.status}`);
  const payload = (await res.json()) as { items: DashboardItemApiDto[]; totalCount: number; page: number; pageSize: number };
  return {
    items: payload.items.map(mapDashboardItem),
    totalCount: payload.totalCount,
    page: payload.page,
    pageSize: payload.pageSize,
  };
}

function mapDashboardItem(item: DashboardItemApiDto): DashboardItem {
  return {
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
  };
}

export async function getItemsByCollection(
  collectionId: string,
  options?: FetchOptions & { page?: number; pageSize?: number },
): Promise<PagedResult<DashboardItem>> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 5;
  const res = await fetchWithRetry(
    `${getApiBaseUrl()}/api/dashboard/items/by-collection/${encodeURIComponent(collectionId)}?page=${page}&pageSize=${pageSize}`,
    { cache: "no-store", headers: authHeaders(options?.accessToken) },
  );
  if (!res.ok) throw new Error(`Failed to fetch items for collection "${collectionId}": ${res.status}`);
  const payload = (await res.json()) as { items: DashboardItemApiDto[]; totalCount: number; page: number; pageSize: number };
  return {
    items: payload.items.map(mapDashboardItem),
    totalCount: payload.totalCount,
    page: payload.page,
    pageSize: payload.pageSize,
  };
}

export async function getItemById(
  id: string,
  options?: FetchOptions,
): Promise<ItemDetail | null> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/items/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch item "${id}": ${response.status}`);
  }

  const item = (await response.json()) as {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    contentType: string;
    language: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    url: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    typeId: string;
    typeName: string;
    typeIcon: string | null;
    typeColor: string | null;
    collectionIds: string[];
    collectionNames: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    typeId: item.typeId,
    typeName: item.typeName,
    typeIcon: item.typeIcon,
    typeColor: item.typeColor,
    collectionIds: item.collectionIds,
    collectionNames: item.collectionNames,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    createdAt: toDateLabel(item.createdAt),
    updatedAt: toDateLabel(item.updatedAt),
  };
}

export async function deleteItem(
  id: string,
  options?: FetchOptions,
): Promise<void> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/items/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete item "${id}": ${response.status}`);
  }
}

type CreateItemPayload = {
  title: string;
  typeName: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
  tags: string[];
  collectionIds: string[];
};

export async function createItem(
  data: CreateItemPayload,
  options?: FetchOptions,
): Promise<ItemDetail> {
  const response = await fetchWithRetry(`${getApiBaseUrl()}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(options?.accessToken),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create item: ${response.status}`);
  }

  const item = (await response.json()) as {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    contentType: string;
    language: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    url: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    typeId: string;
    typeName: string;
    typeIcon: string | null;
    typeColor: string | null;
    collectionIds: string[];
    collectionNames: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    typeId: item.typeId,
    typeName: item.typeName,
    typeIcon: item.typeIcon,
    typeColor: item.typeColor,
    collectionIds: item.collectionIds,
    collectionNames: item.collectionNames,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    createdAt: toDateLabel(item.createdAt),
    updatedAt: toDateLabel(item.updatedAt),
  };
}

type UpdateItemPayload = {
  title: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags: string[];
  collectionIds: string[];
};

export async function updateItem(
  id: string,
  data: UpdateItemPayload,
  options?: FetchOptions,
): Promise<ItemDetail> {
  const response = await fetchWithRetry(
    `${getApiBaseUrl()}/api/items/${encodeURIComponent(id)}`,
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
    throw new Error(`Failed to update item "${id}": ${response.status}`);
  }

  const item = (await response.json()) as {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    contentType: string;
    language: string | null;
    fileUrl: string | null;
    fileName: string | null;
    fileSize: number | null;
    url: string | null;
    isFavorite: boolean;
    isPinned: boolean;
    typeId: string;
    typeName: string;
    typeIcon: string | null;
    typeColor: string | null;
    collectionIds: string[];
    collectionNames: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    language: item.language,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    url: item.url,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    typeId: item.typeId,
    typeName: item.typeName,
    typeIcon: item.typeIcon,
    typeColor: item.typeColor,
    collectionIds: item.collectionIds,
    collectionNames: item.collectionNames,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    createdAt: toDateLabel(item.createdAt),
    updatedAt: toDateLabel(item.updatedAt),
  };
}
