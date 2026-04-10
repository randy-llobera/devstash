import { mockDashboardData } from "@/lib/mock-data";
import { getRecentDashboardCollections } from "@/lib/db/collections";

import { DashboardCollections } from "@/components/dashboard/dashboard-collections";
import { DashboardPinnedItems } from "@/components/dashboard/dashboard-pinned-items";
import { DashboardRecentItems } from "@/components/dashboard/dashboard-recent-items";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

const DashboardPage = async () => {
  const recentCollections = await getRecentDashboardCollections();

  return (
    <DashboardShell>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your developer knowledge hub
        </p>
      </div>

      <DashboardStats data={mockDashboardData} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.9fr)]">
        <DashboardCollections collections={recentCollections} />
        <DashboardPinnedItems data={mockDashboardData} />
      </div>

      <DashboardRecentItems data={mockDashboardData} />
    </DashboardShell>
  );
};

export default DashboardPage;
