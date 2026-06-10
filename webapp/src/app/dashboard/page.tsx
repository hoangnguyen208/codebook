import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/auth";
import { getDisplayName } from "@/lib/auth/user";
import { getDashboardCollections } from "@/lib/db/collections";
import { getRecentDashboardItems, getSystemDashboardItemTypes } from "@/lib/db/items";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const accessToken = session?.accessToken;

  let collections: Awaited<ReturnType<typeof getDashboardCollections>> = [];
  let items: Awaited<ReturnType<typeof getRecentDashboardItems>> = [];
  let itemTypes: Awaited<ReturnType<typeof getSystemDashboardItemTypes>> = [];
  let fetchError: string | null = null;

  try {
    [collections, items, itemTypes] = await Promise.all([
      getDashboardCollections(100, { accessToken }),
      getRecentDashboardItems(100, { accessToken }),
      getSystemDashboardItemTypes({ accessToken }),
    ]);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    console.error("[Dashboard] data fetch failed:", fetchError);
  }

  const userName = session?.user?.name ?? null;
  const userEmail = session?.user?.email ?? null;
  const displayName = getDisplayName(userName, userEmail);
  const recentCollections = [...collections]
    .sort((left, right) =>
      (right.lastUpdatedAt ?? "").localeCompare(left.lastUpdatedAt ?? ""),
    )
    .slice(0, 6);

  return (
    <DashboardShell
      data={{
        user: {
          id: session?.user?.id ?? "user-session",
          name: displayName,
          email: userEmail ?? displayName,
          image: session?.user?.image ?? null,
          plan: "free",
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
      fetchError={fetchError}
    />
  );
}
