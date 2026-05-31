import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardCollections } from "@/lib/db/collections";
import { getRecentDashboardItems, getSystemDashboardItemTypes } from "@/lib/db/items";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [collections, items, itemTypes] = await Promise.all([
    getDashboardCollections(100),
    getRecentDashboardItems(100),
    getSystemDashboardItemTypes(),
  ]);
  const recentCollections = [...collections]
    .sort((left, right) =>
      (right.lastUpdatedAt ?? "").localeCompare(left.lastUpdatedAt ?? ""),
    )
    .slice(0, 6);

  return (
    <DashboardShell
      data={{
        user: {
          id: "user-demo",
          name: "Demo User",
          email: "demo@codebook.io",
          avatarLabel: "DU",
          plan: "pro",
        },
        itemTypes,
        collections: collections.map((collection) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          color: collection.dominantColor,
          isFavorite: collection.isFavorite,
        })),
        items,
      }}
      recentCollectionsOverride={recentCollections}
    />
  );
}
