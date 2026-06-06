import "server-only";

export type ProfileStats = {
  totalItems: number;
  totalCollections: number;
  typeBreakdown: ItemTypeStat[];
};

export type ItemTypeStat = {
  typeId: string;
  typeName: string;
  icon: string | null;
  color: string | null;
  count: number;
  label: string;
  colorToken: string;
};

type ProfileStatsApiDto = {
  totalItems: number;
  totalCollections: number;
  typeBreakdown: {
    typeId: string;
    typeName: string;
    icon: string | null;
    color: string | null;
    count: number;
  }[];
};

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return baseUrl.replace(/\/$/, "");
}

function toTypeLabel(name: string) {
  switch (name.toLowerCase()) {
    case "snippet": return "Snippets";
    case "prompt": return "Prompts";
    case "command": return "Commands";
    case "note": return "Notes";
    case "file": return "Files";
    case "image": return "Images";
    case "link": return "Links";
    default: return `${name.charAt(0).toUpperCase()}${name.slice(1)}s`;
  }
}

function toColorToken(name: string, color: string | null) {
  const byName: Record<string, string> = {
    snippet: "blue", prompt: "purple", command: "orange",
    note: "yellow", file: "slate", image: "pink", link: "emerald",
  };
  const byHex: Record<string, string> = {
    "#3b82f6": "blue", "#8b5cf6": "purple", "#f97316": "orange",
    "#fde047": "yellow", "#6b7280": "slate", "#ec4899": "pink", "#10b981": "emerald",
  };
  return byName[name.toLowerCase()] ?? (color ? byHex[color.toLowerCase()] : undefined) ?? "slate";
}

export async function getProfileStats(): Promise<ProfileStats> {
  const response = await fetch(`${getApiBaseUrl()}/api/profile/stats`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch profile stats: ${response.status}`);
  }

  const payload = (await response.json()) as ProfileStatsApiDto;

  return {
    totalItems: payload.totalItems,
    totalCollections: payload.totalCollections,
    typeBreakdown: payload.typeBreakdown.map((item) => ({
      typeId: item.typeId,
      typeName: item.typeName,
      icon: item.icon,
      color: item.color,
      count: item.count,
      label: toTypeLabel(item.typeName),
      colorToken: toColorToken(item.typeName, item.color),
    })),
  };
}
