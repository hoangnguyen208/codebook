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
