import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { auth } from "@/auth";
import { getDisplayName } from "@/lib/auth/user";
import { getDashboardCollections } from "@/lib/db/collections";
import { getRecentDashboardItems, getSystemDashboardItemTypes } from "@/lib/db/items";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const accessToken = session?.accessToken;
  const [collections, items, itemTypes] = await Promise.all([
    getDashboardCollections(100, { accessToken }),
    getRecentDashboardItems(100, { accessToken }),
    getSystemDashboardItemTypes({ accessToken }),
  ]);

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
    />
  );
}
