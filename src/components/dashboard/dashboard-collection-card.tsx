import Link from "next/link";
import { ArrowRight, Folder, Star } from "lucide-react";

import type { DashboardCollection } from "@/lib/db/collections";
import { cn } from "@/lib/utils";
import { formatUpdatedAt } from "@/components/utils/date";
import { getItemTypeIcon } from "@/components/utils/item-type";

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
  collection: DashboardCollection;
}

export const DashboardCollectionCard = ({
  collection,
}: DashboardCollectionCardProps) => {
  const href = `/collections/${collection.id}`;
  const dominantTypeLabel = collection.itemTypes[0]?.name ?? "No types";
  const dominantTypeText =
    collection.typeCount > 0 ? `${dominantTypeLabel} leads` : "No types yet";

  return (
    <Link
      href={href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <Card
        className={cn("border border-border/70 border-l-4 bg-background/50 transition-colors hover:border-primary/40 hover:bg-muted/40")}
        style={
          collection.dominantTypeColor
            ? { borderLeftColor: collection.dominantTypeColor }
            : undefined
        }
      >
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
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{collection.typeCount} types</span>
              <span>{dominantTypeText}</span>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {collection.itemTypes.map((itemType) => {
                const Icon = getItemTypeIcon(itemType.icon);

                return (
                  <span
                    key={itemType.id}
                    title={itemType.name}
                    className="inline-flex size-8 items-center justify-center rounded-full border border-border/70 bg-muted/40"
                  >
                    <Icon
                      className="size-3.5"
                      style={itemType.color ? { color: itemType.color } : undefined}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="justify-between border-t-0 bg-transparent pt-0 text-sm text-muted-foreground">
          <span>Updated {formatUpdatedAt(collection.updatedAt)}</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground transition-colors group-hover:text-primary">
            Open
            <ArrowRight className="size-4" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
};
