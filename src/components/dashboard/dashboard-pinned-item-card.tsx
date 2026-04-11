import { createElement } from "react";
import Link from "next/link";
import { Pin } from "lucide-react";

import type { DashboardItem } from "@/lib/db/items";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardPinnedItemCardProps {
  item: DashboardItem;
}

export const DashboardPinnedItemCard = ({ item }: DashboardPinnedItemCardProps) => {
  return (
    <Link href="#" className="block">
      <Card
        className="border-border/70 bg-background/50 transition-colors hover:border-primary/40 hover:bg-muted/40"
        style={{ borderLeftColor: item.itemType.color, borderLeftWidth: "4px" }}
      >
        <CardContent className="flex items-start gap-3">
          <div className="rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground">
            {createElement(getItemTypeIcon(item.itemType.icon), {
              className: "size-4",
              style: { color: item.itemType.color },
            })}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <Pin className="size-3.5 shrink-0 text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {item.collection ? (
                <Badge variant="outline" className="rounded-full px-2.5 py-1">
                  {item.collection.name}
                </Badge>
              ) : null}
              <Badge variant="outline" className="rounded-full px-2.5 py-1">
                {item.itemType.name}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
