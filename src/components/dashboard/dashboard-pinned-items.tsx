import type { DashboardItem } from "@/lib/db/items";

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
  items: DashboardItem[];
}

export const DashboardPinnedItems = ({ items }: DashboardPinnedItemsProps) => {
  if (items.length === 0) {
    return null;
  }

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
          {items.length} pinned
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <DashboardPinnedItemCard key={item.id} item={item} />
        ))}
      </CardContent>
    </Card>
  );
};
