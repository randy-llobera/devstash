import { redirect } from "next/navigation";

import {
  getAvailableCollections,
  getFavoriteDashboardCollections,
  getSidebarCollectionsData,
} from "@/lib/db/collections";
import { getDashboardUser } from "@/lib/db/dashboard-user";
import {
  getFavoriteDashboardItems,
  getSidebarItemTypes,
} from "@/lib/db/items";

import { FavoritesList } from "@/components/dashboard/favorites-list";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const FavoritesPage = async () => {
  const [user, itemTypes, sidebarCollections, collections, favoriteItems, favoriteCollections] =
    await Promise.all([
      getDashboardUser(),
      getSidebarItemTypes(),
      getSidebarCollectionsData(),
      getAvailableCollections(),
      getFavoriteDashboardItems(),
      getFavoriteDashboardCollections(),
    ]);

  if (!user) {
    redirect("/sign-in");
  }

  const totalFavorites = favoriteItems.length + favoriteCollections.length;

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
          <h1 className="text-3xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-base text-muted-foreground">
            {totalFavorites} {totalFavorites === 1 ? "favorite" : "favorites"}
          </p>
        </div>

        <FavoritesList items={favoriteItems} collections={favoriteCollections} />
      </div>
    </DashboardShell>
  );
};

export default FavoritesPage;
