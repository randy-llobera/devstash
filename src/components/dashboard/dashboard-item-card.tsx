"use client";

import { createElement } from "react";
import { Pin, Star } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";

import { useItemDrawer } from "@/components/dashboard/item-drawer-provider";
import { formatUpdatedAt } from "@/components/utils/date";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardItemCardProps {
  item: DashboardItem;
  showPinnedIndicator?: boolean;
  variant?: "default" | "items";
}

export const DashboardItemCard = ({
  item,
  showPinnedIndicator = false,
  variant = "default",
}: DashboardItemCardProps) => {
  const { openItem } = useItemDrawer();
  const isItemsVariant = variant === "items";

  return (
    <button
      type="button"
      className="block w-full rounded-[1.25rem] border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      onClick={() => openItem(item)}
    >
      <Card
        className={
          isItemsVariant
            ? "h-full overflow-hidden border-border/60 bg-card/55 shadow-sm shadow-black/10 transition-colors hover:border-foreground/15 hover:bg-card/75"
            : "h-full border-border/70 bg-background/50 transition-colors hover:border-primary/40 hover:bg-muted/40"
        }
        style={{ borderLeftColor: item.itemType.color, borderLeftWidth: "4px" }}
      >
        <CardContent className={isItemsVariant ? "flex h-full items-start gap-4 px-5 py-5" : "flex h-full items-start gap-3"}>
          <div
            className={
              isItemsVariant
                ? "mt-0.5 rounded-2xl bg-muted/45 p-3 text-muted-foreground ring-1 ring-white/5"
                : "rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground"
            }
          >
            {createElement(getItemTypeIcon(item.itemType.icon), {
              className: isItemsVariant ? "size-5" : "size-4",
              style: { color: item.itemType.color },
            })}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className={isItemsVariant ? "flex items-start justify-between gap-4" : "flex items-center gap-2"}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className={isItemsVariant ? "truncate text-[1.05rem] font-semibold tracking-[-0.01em]" : "truncate text-sm font-semibold"}>
                    {item.title}
                  </p>
                  {showPinnedIndicator && item.isPinned ? (
                    <Pin className="size-3.5 shrink-0 text-primary" />
                  ) : null}
                  {item.isFavorite ? (
                    <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                  ) : null}
                </div>

                <p className={isItemsVariant ? "mt-1.5 line-clamp-2 text-sm text-muted-foreground" : "mt-1 text-sm text-muted-foreground"}>
                  {item.description}
                </p>
              </div>

              {isItemsVariant ? (
                <span className="shrink-0 pt-0.5 text-xs font-medium text-muted-foreground">
                  {formatUpdatedAt(item.updatedAt)}
                </span>
              ) : null}
            </div>

            {isItemsVariant ? (
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: item.itemType.color }}
                />
                <span className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {item.itemType.name}
                </span>
                {item.collection ? (
                  <span className="truncate text-xs text-muted-foreground/80">
                    in {item.collection.name}
                  </span>
                ) : null}
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.collection ? (
                    <Badge variant="outline" className="rounded-full px-2.5 py-1">
                      {item.collection.name}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="rounded-full px-2.5 py-1">
                    {item.itemType.name}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full px-2.5 py-1 text-muted-foreground"
                  >
                    Updated {formatUpdatedAt(item.updatedAt)}
                  </Badge>
                </div>

                {item.tags.length > 0 ? (
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
                ) : null}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
};
