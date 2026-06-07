import "server-only";

export type DashboardItem = {
  id: string;
  title: string;
  description: string;
  typeId: string;
  collectionId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
};

export type DashboardItemType = {
  id: string;
  name: string;
  label: string;
  icon: "code" | "sparkles" | "terminal" | "file-text" | "file" | "image" | "link";
  color: string;
  isSystem: boolean;
};

type DashboardItemApiDto = {
  id: string;
  title: string;
  description: string | null;
  typeId: string;
  collectionId: string | null;
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

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
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

export async function getSystemDashboardItemTypes(): Promise<DashboardItemType[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/dashboard/item-types/system`, {
    cache: "no-store",
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
): Promise<DashboardItem[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/dashboard/items/recent?limit=${limit}`,
    { cache: "no-store" },
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
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: toDateLabel(item.updatedAt),
  }));
}

export async function getItemsByType(
  typeName: string,
): Promise<DashboardItem[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/dashboard/items/by-type/${encodeURIComponent(typeName)}`,
    { cache: "no-store" },
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
    tags: item.tags.filter((tag) => tag.trim().length > 0),
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: toDateLabel(item.updatedAt),
  }));
}
