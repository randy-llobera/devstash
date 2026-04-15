"use client";

import { createElement } from "react";
import { Star } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";

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
    <button
      type="button"
      className="grid w-full border-0 bg-transparent px-5 py-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto] md:items-center"
      onClick={() => openItem(item)}
    >
      <div className="flex min-w-0 items-start gap-3">
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{item.title}</p>
            {item.isFavorite ? (
              <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-full px-2.5 py-1 text-muted-foreground"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {item.collection ? (
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            {item.collection.name}
          </Badge>
        ) : null}
        <Badge variant="outline" className="rounded-full px-2.5 py-1">
          {item.itemType.name}
        </Badge>
      </div>

      <div className="text-sm text-muted-foreground">
        {formatUpdatedAt(item.updatedAt)}
      </div>
    </button>
  );
};
