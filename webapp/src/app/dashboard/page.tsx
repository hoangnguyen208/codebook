import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getRecentDashboardCollections } from "@/lib/db/collections";
import { getRecentDashboardItems } from "@/lib/db/items";
import { mockDashboardData } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [collections, items] = await Promise.all([
    getRecentDashboardCollections(100),
    getRecentDashboardItems(100),
  ]);
  const recentCollections = collections.slice(0, 6);

  return (
    <DashboardShell
      data={{
        user: mockDashboardData.user,
        itemTypes: mockDashboardData.itemTypes,
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
