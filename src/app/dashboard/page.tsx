import {
  getAvailableCollections,
  getRecentDashboardCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  getDashboardStats,
  getPinnedDashboardItems,
  getRecentDashboardItems,
  getSidebarItemTypes,
} from "@/lib/db/items";

import { DashboardCollections } from "@/components/dashboard/dashboard-collections";
import { DashboardPinnedItems } from "@/components/dashboard/dashboard-pinned-items";
import { DashboardRecentItems } from "@/components/dashboard/dashboard-recent-items";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

const DashboardPage = async () => {
  const [
    user,
    stats,
    itemTypes,
    sidebarCollections,
    collections,
    recentCollections,
    pinnedItems,
    recentItems,
  ] = await Promise.all([
    getDashboardUser(),
    getDashboardStats(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
    getRecentDashboardCollections(),
    getPinnedDashboardItems(),
    getRecentDashboardItems(),
  ]);

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
      contentClassName="max-w-none"
    >
      <div className="mx-auto flex w-full flex-col gap-10 xl:w-[80%]">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your developer knowledge hub
          </p>
        </div>

        <DashboardStats data={stats} />
        <DashboardCollections collections={recentCollections} />

        <div className="space-y-10">
          <DashboardPinnedItems items={pinnedItems} />
          <DashboardRecentItems items={recentItems} />
        </div>
      </div>
    </DashboardShell>
  );
};

export default DashboardPage;
