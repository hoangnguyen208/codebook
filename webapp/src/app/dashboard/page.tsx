import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getRecentDashboardCollections } from "@/lib/db/collections";
import { mockDashboardData } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const recentCollections = await getRecentDashboardCollections(6);

  return (
    <DashboardShell
      data={mockDashboardData}
      recentCollectionsOverride={recentCollections}
    />
  );
}
