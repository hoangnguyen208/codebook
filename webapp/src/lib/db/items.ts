import "server-only";

import type { DashboardItem, DashboardItemType, ItemDetail } from "@/types/items";

export type { DashboardItem, DashboardItemType, ItemDetail };

type DashboardItemApiDto = {
  id: string;
  title: string;
  description: string | null;
  typeId: string;
  collectionId: string | null;
  fileUrl: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
};

type DashboardItemTypeApiDto = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
};

type FetchOptions = {
  accessToken?: string;
};

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

function authHeaders(accessToken?: string): Record<string, string> {
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
}

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
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/item-types/system`, {
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
  const response = await fetch(
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
    typeId: item.typeId,
    collectionId: item.collectionId ?? "",
    fileUrl: item.fileUrl ?? null,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: toDateLabel(item.updatedAt),
  }));
}

export async function getItemsByType(
  typeName: string,
  options?: FetchOptions,
): Promise<DashboardItem[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/dashboard/items/by-type/${encodeURIComponent(typeName)}`,
    {
      cache: "no-store",
      headers: authHeaders(options?.accessToken),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch items by type "${typeName}": ${response.status}`);
  }

  const payload = (await response.json()) as DashboardItemApiDto[];

  return payload.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description ?? "",
    typeId: item.typeId,
    collectionId: item.collectionId ?? "",
    fileUrl: item.fileUrl ?? null,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: toDateLabel(item.updatedAt),
  }));
}

export async function getItemById(
  id: string,
  options?: FetchOptions,
): Promise<ItemDetail | null> {
  const response = await fetch(
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
    collectionId: string | null;
    collectionName: string | null;
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
    collectionId: item.collectionId,
    collectionName: item.collectionName,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    createdAt: toDateLabel(item.createdAt),
    updatedAt: toDateLabel(item.updatedAt),
  };
}

export async function deleteItem(
  id: string,
  options?: FetchOptions,
): Promise<void> {
  const response = await fetch(
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
};

export async function createItem(
  data: CreateItemPayload,
  options?: FetchOptions,
): Promise<ItemDetail> {
  const response = await fetch(`${getApiBaseUrl()}/api/items`, {
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
    collectionId: string | null;
    collectionName: string | null;
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
    collectionId: item.collectionId,
    collectionName: item.collectionName,
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
};

export async function updateItem(
  id: string,
  data: UpdateItemPayload,
  options?: FetchOptions,
): Promise<ItemDetail> {
  const response = await fetch(
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
    collectionId: string | null;
    collectionName: string | null;
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
    collectionId: item.collectionId,
    collectionName: item.collectionName,
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    createdAt: toDateLabel(item.createdAt),
    updatedAt: toDateLabel(item.updatedAt),
  };
}
