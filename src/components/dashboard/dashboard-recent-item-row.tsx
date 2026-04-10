import Link from "next/link";
import { Star } from "lucide-react";

import type { MockCollection, MockItem, MockItemType } from "@/lib/mock-data";
import { formatUpdatedAt } from "@/components/utils/date";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { Badge } from "@/components/ui/badge";

interface DashboardRecentItemRowProps {
  item: MockItem;
  collection?: MockCollection;
  itemType?: MockItemType;
}

export const DashboardRecentItemRow = ({
  item,
  collection,
  itemType,
}: DashboardRecentItemRowProps) => {
  const Icon = getItemTypeIcon(itemType?.icon ?? "File");

  return (
    <Link
      href="#"
      className="grid gap-4 px-5 py-4 transition-colors hover:bg-muted/30 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto] md:items-center"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground">
          <Icon
            className="size-4"
            style={itemType?.color ? { color: itemType.color } : undefined}
          />
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
        {collection ? (
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            {collection.name}
          </Badge>
        ) : null}
        {itemType ? (
          <Badge variant="outline" className="rounded-full px-2.5 py-1">
            {itemType.name}
          </Badge>
        ) : null}
      </div>

      <div className="text-sm text-muted-foreground">
        {formatUpdatedAt(item.updatedAt)}
      </div>
    </Link>
  );
};
