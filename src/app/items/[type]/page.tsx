import { notFound } from "next/navigation";

import {
  getItemsByTypeSlug,
  getItemTypeLabel,
  getSidebarItemTypes,
} from "@/lib/db/items";
import {
  getAvailableCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import { ITEMS_PER_PAGE, parsePageParam } from "@/lib/pagination";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardItemsList } from "@/components/dashboard/dashboard-items-list";
import { PaginationControls } from "@/components/dashboard/pagination-controls";
import { ItemsUpgradePage } from "@/components/items/items-upgrade-page";

interface ItemsByTypePageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams?: Promise<{
    page?: string | string[];
  }>;
}

const PRO_ONLY_ITEM_ROUTE_TYPES = new Set(["files", "images"]);

const ItemsByTypePage = async ({
  params,
  searchParams,
}: ItemsByTypePageProps) => {
  const { type } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams?.page);
  const [user, itemTypes, sidebarCollections, collections] = await Promise.all([
    getDashboardUser(),
    getSidebarItemTypes(),
    getSidebarCollectionsData(),
    getAvailableCollections(),
  ]);

  if (PRO_ONLY_ITEM_ROUTE_TYPES.has(type) && !user?.isPro) {
    return (
      <DashboardShell
        user={user}
        collections={collections}
        itemTypes={itemTypes}
        favoriteCollections={sidebarCollections.favoriteCollections}
        recentCollections={sidebarCollections.recentCollections}
      >
        <ItemsUpgradePage itemTypeLabel={type === "files" ? "Files" : "Images"} />
      </DashboardShell>
    );
  }

  const result = await getItemsByTypeSlug(type, page, ITEMS_PER_PAGE);

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
            {result.pagination.totalItems} {result.pagination.totalItems === 1 ? "item" : "items"}
          </p>
        </div>

        <div className="space-y-5">
          <DashboardItemsList itemType={result.itemType} items={result.items} />
          <PaginationControls
            basePath={`/items/${type}`}
            pagination={result.pagination}
          />
        </div>
      </div>
    </DashboardShell>
  );
};

export default ItemsByTypePage;
