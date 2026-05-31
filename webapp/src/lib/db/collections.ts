import "server-only";

export type DashboardRecentCollection = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  lastUpdatedAt: string | null;
  dominantColor: string;
  typeIcons: string[];
};

type DashboardRecentCollectionApiDto = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  lastUpdatedAt: string;
  dominantColor: string;
  typeIcons: string[];
};

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
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

function toDateLabel(value: string) {
  return value.slice(0, 10);
}

export async function getRecentDashboardCollections(
  limit = 6,
): Promise<DashboardRecentCollection[]> {
  const response = await fetch(
    `${getApiBaseUrl()}/api/dashboard/collections/recent?limit=${limit}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch recent dashboard collections: ${response.status}`,
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
    typeIcons: [...new Set(collection.typeIcons.map(normalizeIconName))],
  }));
}
