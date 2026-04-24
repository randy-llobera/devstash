"use client";

import { createElement } from "react";

import type { DashboardItem } from "@/lib/db/items";

import { ItemFavoriteButton } from "@/components/dashboard/item-favorite-button";
import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatUpdatedAt } from "@/components/utils/date";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { Badge } from "@/components/ui/badge";

interface DashboardRecentItemRowProps {
  item: DashboardItem;
}

export const DashboardRecentItemRow = ({ item }: DashboardRecentItemRowProps) => {
  const { openItem } = useItemDrawer();

  return (
    <div className="grid w-full px-4 py-3.5 text-left transition-colors hover:bg-muted/25 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60"
          onClick={() => openItem(item)}
        >
          <div
            className="rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground"
            style={{ borderColor: item.itemType.color }}
          >
            {createElement(getItemTypeIcon(item.itemType.icon), {
              className: "size-4",
              style: { color: item.itemType.color },
            })}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.description}
            </p>
          </div>
        </button>

        <ItemFavoriteButton
          itemId={item.id}
          itemTitle={item.title}
          isFavorite={item.isFavorite}
          className="mt-0.5 shrink-0 rounded-full text-muted-foreground"
          iconClassName="size-3.5"
          stopPropagation={false}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground md:mt-0">
        {item.collection ? (
          <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
            {item.collection.name}
          </Badge>
        ) : null}
        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
          {item.itemType.name}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {formatUpdatedAt(item.updatedAt)}
      </div>
    </div>
  );
};
