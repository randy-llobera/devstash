import { notFound } from "next/navigation";

import {
  getItemsByTypeSlug,
  getSidebarItemTypes,
  getItemTypeLabel,
} from "@/lib/db/items";
import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardItemsList } from "@/components/dashboard/dashboard-items-list";

interface ItemsByTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

const ItemsByTypePage = async ({ params }: ItemsByTypePageProps) => {
  const { type } = await params;
  const [user, itemTypes, sidebarCollections, collections, result] =
    await Promise.all([
      getDashboardUser(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
      getItemsByTypeSlug(type),
    ]);

  if (!result) {
    notFound();
  }

  return (
    <DashboardShell
      user={user}
      collections={collections}
      itemTypes={itemTypes}
      favoriteCollections={sidebarCollections.favoriteCollections}
      recentCollections={sidebarCollections.recentCollections}
    >
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            {getItemTypeLabel(result.itemType.name)}
          </h1>
          <p className="text-base text-muted-foreground">
            {result.items.length} {result.items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="space-y-5">
          <DashboardItemsList itemType={result.itemType} items={result.items} />
        </div>
      </div>
    </DashboardShell>
  );
};

export default ItemsByTypePage;
