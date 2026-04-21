"use client";

import { createElement } from "react";
import Link from "next/link";
import { Folder, Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import type { DashboardItem } from "@/lib/db/items";

import { formatDate } from "@/components/utils/date";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { Badge } from "@/components/ui/badge";

interface FavoritesListProps {
  items: DashboardItem[];
  collections: DashboardCollection[];
}

interface FavoritesSectionHeaderProps {
  title: string;
  count: number;
}

const FavoritesSectionHeader = ({ title, count }: FavoritesSectionHeaderProps) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-2">
    <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.16em] text-foreground">
      {title}
    </h2>
    <span className="font-mono text-xs text-muted-foreground">
      {count}
    </span>
  </div>
);

export const FavoritesList = ({ items, collections }: FavoritesListProps) => {
  const { openItem } = useItemDrawer();
  const hasFavorites = items.length > 0 || collections.length > 0;

  if (!hasFavorites) {
    return (
      <div className="border border-dashed border-border/70 px-6 py-14 text-center">
        <p className="font-mono text-sm font-semibold uppercase tracking-[0.16em]">
          No favorites yet
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Favorite items or collections to keep them close.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <FavoritesSectionHeader count={items.length} title="Items" />
        {items.length > 0 ? (
          <div className="divide-y divide-border/60 border-y border-border/60">
            {items.map((item) => {
              const Icon = getItemTypeIcon(item.itemType.icon);

              return (
                <button
                  key={item.id}
                  type="button"
                  className="grid w-full gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:grid-cols-[minmax(0,1.7fr)_auto_auto] md:items-center"
                  onClick={() => openItem(item)}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/35">
                      {createElement(Icon, {
                        className: "size-4",
                        style: { color: item.itemType.color },
                      })}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-mono text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        {item.isFavorite ? (
                          <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.collection?.name ?? item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full px-2.5 py-1 font-mono text-[11px]">
                      {item.itemType.name}
                    </Badge>
                  </div>

                  <div className="font-mono text-xs text-muted-foreground md:text-right">
                    {formatDate(item.updatedAt)}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No favorited items.</p>
        )}
      </section>

      <section className="space-y-3">
        <FavoritesSectionHeader count={collections.length} title="Collections" />
        {collections.length > 0 ? (
          <div className="divide-y divide-border/60 border-y border-border/60">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="grid gap-3 px-3 py-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:grid-cols-[minmax(0,1.7fr)_auto_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/35">
                    <Folder className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-sm font-medium text-foreground">
                        {collection.name}
                      </span>
                      <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2.5 py-1 font-mono text-[11px]">
                    collection
                  </Badge>
                </div>

                <div className="font-mono text-xs text-muted-foreground md:text-right">
                  {formatDate(collection.updatedAt)}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No favorited collections.</p>
        )}
      </section>
    </div>
  );
};
