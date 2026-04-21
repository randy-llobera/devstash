"use client";

import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleItemFavorite } from "@/actions/items";
import type { ItemDrawerDetail } from "@/lib/db/items";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemFavoriteButtonProps {
  className?: string;
  iconClassName?: string;
  itemId: string;
  itemTitle: string;
  isFavorite: boolean;
  label?: string;
  onToggled?: (item: ItemDrawerDetail) => void;
  size?: "sm" | "icon-sm";
  stopPropagation?: boolean;
  variant?: "ghost" | "outline";
}

export const ItemFavoriteButton = ({
  className,
  iconClassName,
  itemId,
  itemTitle,
  isFavorite,
  label,
  onToggled,
  size = "icon-sm",
  stopPropagation = true,
  variant = "ghost",
}: ItemFavoriteButtonProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState(isFavorite);

  useEffect(() => {
    setOptimisticIsFavorite(isFavorite);
  }, [isFavorite]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    const nextIsFavorite = !optimisticIsFavorite;
    setOptimisticIsFavorite(nextIsFavorite);

    const result = await toggleItemFavorite(itemId, nextIsFavorite);

    if (!result.success || !result.data) {
      setOptimisticIsFavorite(isFavorite);
      toast.error(result.error ?? "Unable to update item.");
      return;
    }

    setOptimisticIsFavorite(result.data.isFavorite);
    onToggled?.(result.data);
    invalidateSearchData();
    toast.success(
      result.data.isFavorite
        ? `"${itemTitle}" added to favorites.`
        : `"${itemTitle}" removed from favorites.`,
    );
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        optimisticIsFavorite && "text-yellow-400 hover:text-yellow-400",
        className,
      )}
      aria-label={optimisticIsFavorite ? `Remove ${itemTitle} from favorites` : `Add ${itemTitle} to favorites`}
      aria-pressed={optimisticIsFavorite}
      disabled={isPending}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      <Star
        className={cn(
          "size-4",
          optimisticIsFavorite && "fill-current text-yellow-400",
          iconClassName,
        )}
      />
      {label ? <span>{label}</span> : null}
    </Button>
  );
};
