import type { MockDashboardData } from "@/lib/mock-data";

import { DashboardPinnedItemCard } from "@/components/dashboard/dashboard-pinned-item-card";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardPinnedItemsProps {
  data: MockDashboardData;
}

export const DashboardPinnedItems = ({ data }: DashboardPinnedItemsProps) => {
  const collectionLookup = new Map(
    data.collections.map((collection) => [collection.id, collection])
  );
  const itemTypeLookup = new Map(
    data.itemTypes.map((itemType) => [itemType.id, itemType])
  );
  const pinnedItems = data.items
    .filter((item) => item.isPinned)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Pinned Items
          </CardTitle>
          <CardDescription>
            Keep your most important references one click away.
          </CardDescription>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          {pinnedItems.length} pinned
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {pinnedItems.map((item) => (
          <DashboardPinnedItemCard
            key={item.id}
            item={item}
            collection={collectionLookup.get(item.collectionId)}
            itemType={itemTypeLookup.get(item.typeId)}
          />
        ))}
      </CardContent>
    </Card>
  );
};
