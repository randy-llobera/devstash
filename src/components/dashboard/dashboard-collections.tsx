import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { MockDashboardData } from "@/lib/mock-data";

import { DashboardCollectionCard } from "@/components/dashboard/dashboard-collection-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardCollectionsProps {
  data: MockDashboardData;
}

export const DashboardCollections = ({ data }: DashboardCollectionsProps) => {
  const itemTypeLookup = new Map(
    data.itemTypes.map((itemType) => [itemType.id, itemType])
  );

  const recentCollections = data.collections
    .map((collection) => {
      const mostRecentItem = data.items
        .filter((item) => item.collectionId === collection.id)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];

      return {
        ...collection,
        updatedAt: mostRecentItem?.updatedAt ?? "",
      };
    })
    .filter((collection) => collection.updatedAt)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  return (
    <Card className="border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Recent Collections
          </CardTitle>
          <CardDescription>
            Jump back into the collections you touched most recently.
          </CardDescription>
        </div>
        <Link
          href="#"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {recentCollections.map((collection) => (
            <DashboardCollectionCard
              key={collection.id}
              collection={collection}
              itemTypes={collection.itemTypeIds
                .map((typeId) => itemTypeLookup.get(typeId))
                .filter((itemType) => itemType !== undefined)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
