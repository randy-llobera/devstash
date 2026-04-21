"use client";

import { useEffect, useState, useTransition, type MouseEvent } from "react";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { toggleItemPin } from "@/actions/items";
import type { ItemDrawerDetail } from "@/lib/db/items";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemPinButtonProps {
  className?: string;
  iconClassName?: string;
  itemId: string;
  itemTitle: string;
  isPinned: boolean;
  label?: string;
  onToggled?: (item: ItemDrawerDetail) => void;
  size?: "sm" | "icon-sm";
  stopPropagation?: boolean;
  variant?: "ghost" | "outline";
}

export const ItemPinButton = ({
  className,
  iconClassName,
  itemId,
  itemTitle,
  isPinned,
  label,
  onToggled,
  size = "icon-sm",
  stopPropagation = true,
  variant = "ghost",
}: ItemPinButtonProps) => {
  const router = useRouter();
  const { invalidateSearchData } = useSearch();
  const [isPending, startTransition] = useTransition();
  const [optimisticIsPinned, setOptimisticIsPinned] = useState(isPinned);

  useEffect(() => {
    setOptimisticIsPinned(isPinned);
  }, [isPinned]);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (stopPropagation) {
      event.preventDefault();
      event.stopPropagation();
    }

    const nextIsPinned = !optimisticIsPinned;
    setOptimisticIsPinned(nextIsPinned);

    const result = await toggleItemPin(itemId, nextIsPinned);

    if (!result.success || !result.data) {
      setOptimisticIsPinned(isPinned);
      toast.error(result.error ?? "Unable to update item.");
      return;
    }

    setOptimisticIsPinned(result.data.isPinned);
    onToggled?.(result.data);
    invalidateSearchData();
    toast.success(
      result.data.isPinned
        ? `"${itemTitle}" pinned.`
        : `"${itemTitle}" unpinned.`,
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
        optimisticIsPinned && "text-primary hover:text-primary",
        className,
      )}
      aria-label={optimisticIsPinned ? `Unpin ${itemTitle}` : `Pin ${itemTitle}`}
      aria-pressed={optimisticIsPinned}
      disabled={isPending}
      onClick={(event) => {
        void handleClick(event);
      }}
    >
      <Pin
        className={cn(
          "size-4",
          optimisticIsPinned && "fill-current text-primary",
          iconClassName,
        )}
      />
      {label ? <span>{label}</span> : null}
    </Button>
  );
};
