import type { MockDashboardData } from "@/lib/mock-data";

import { DashboardRecentItemRow } from "@/components/dashboard/dashboard-recent-item-row";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardRecentItemsProps {
  data: MockDashboardData;
}

export const DashboardRecentItems = ({ data }: DashboardRecentItemsProps) => {
  const collectionLookup = new Map(
    data.collections.map((collection) => [collection.id, collection])
  );
  const itemTypeLookup = new Map(
    data.itemTypes.map((itemType) => [itemType.id, itemType])
  );
  const recentItems = [...data.items]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 10);

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Recent Items
          </CardTitle>
          <CardDescription>
            The latest additions and updates across your saved knowledge.
          </CardDescription>
        </div>
        <Badge variant="outline" className="rounded-full px-3 py-1">
          Showing {recentItems.length} items
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border/70">
          <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto] gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground md:grid">
            <span>Item</span>
            <span>Collection</span>
            <span>Updated</span>
          </div>

          <div className="divide-y divide-border/70">
            {recentItems.map((item) => (
              <DashboardRecentItemRow
                key={item.id}
                item={item}
                collection={collectionLookup.get(item.collectionId)}
                itemType={itemTypeLookup.get(item.typeId)}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
