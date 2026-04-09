import Link from "next/link";
import { ArrowRight, Folder, Star } from "lucide-react";

import type { MockCollection, MockItemType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { formatUpdatedAt, getItemTypeColorClass, getItemTypeIcon } from "@/components/dashboard/dashboard-icons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardCollectionCardProps {
  collection: MockCollection & { updatedAt: string };
  itemTypes: MockItemType[];
}

export const DashboardCollectionCard = ({
  collection,
  itemTypes,
}: DashboardCollectionCardProps) => {
  return (
    <Card className="border-border/70 bg-background/50 transition-colors hover:border-primary/40 hover:bg-muted/40">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              <Folder className="size-3.5" />
              {collection.itemCount} items
            </Badge>
            <div>
              <CardTitle className="text-base font-semibold">
                {collection.name}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {collection.description}
              </p>
            </div>
          </div>
          {collection.isFavorite ? (
            <CardAction>
              <Star className="size-4 fill-current text-yellow-400" />
            </CardAction>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap gap-2">
          {itemTypes.slice(0, 3).map((itemType) => {
            const Icon = getItemTypeIcon(itemType.icon);

            return (
              <Badge
                key={itemType.id}
                variant="outline"
                className="rounded-full px-3 py-1 text-xs text-muted-foreground"
              >
                <Icon
                  className={cn("size-3.5", getItemTypeColorClass(itemType.color))}
                />
                {itemType.name}
              </Badge>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="justify-between border-t-0 bg-transparent pt-0 text-sm text-muted-foreground">
        <span>Updated {formatUpdatedAt(collection.updatedAt)}</span>
        <Link
          href="#"
          className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary"
        >
          Open
          <ArrowRight className="size-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};
