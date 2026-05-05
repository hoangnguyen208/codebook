import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { mockDashboardData } from "@/lib/mock-data";

export default function DashboardPage() {
  return <DashboardShell data={mockDashboardData} />;
}
