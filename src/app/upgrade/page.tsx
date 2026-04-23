import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { getSidebarItemTypes } from "@/lib/db/items";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UpgradePage } from "@/components/settings/upgrade-page";

const UpgradeRoutePage = async () => {
  const [user, itemTypes, sidebarCollections, collections] = await Promise.all([
    getDashboardUser(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <UpgradePage
        isPro={user.isPro}
        stripeCustomerId={user.stripeCustomerId}
      />
    </DashboardShell>
  );
};

export default UpgradeRoutePage;
