import Link from "next/link";
import { Pin } from "lucide-react";

import type { MockCollection, MockItem, MockItemType } from "@/lib/mock-data";
import { getItemTypeIcon } from "@/components/utils/item-type";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardPinnedItemCardProps {
  item: MockItem;
  collection?: MockCollection;
  itemType?: MockItemType;
}

export const DashboardPinnedItemCard = ({
  item,
  collection,
  itemType,
}: DashboardPinnedItemCardProps) => {
  const Icon = getItemTypeIcon(itemType?.icon ?? "File");

  return (
    <Link href="#" className="block">
      <Card className="border-border/70 bg-background/50 transition-colors hover:border-primary/40 hover:bg-muted/40">
        <CardContent className="flex items-start gap-3">
          <div className="rounded-xl border border-border/60 bg-muted/50 p-2 text-muted-foreground">
            <Icon
              className="size-4"
              style={itemType?.color ? { color: itemType.color } : undefined}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{item.title}</p>
              <Pin className="size-3.5 shrink-0 text-primary" />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
