import type { ReactNode } from "react";
import Link from "next/link";
import { FolderPlus, Plus, Search, Star } from "lucide-react";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  mobileSidebar: ReactNode;
  onCreateCollection: () => void;
  onCreateItem: () => void;
}

export const TopBar = ({
  mobileSidebar,
  onCreateCollection,
  onCreateItem,
}: TopBarProps) => {
  const { openSearch } = useSearch();

  return (
    <header className="border-b border-border/70">
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 lg:flex lg:items-center lg:gap-4">
          <div className="justify-self-start lg:hidden">{mobileSidebar}</div>
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              DS
            </div>
            <span className="text-lg font-semibold tracking-tight">DevStash</span>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              DS
            </div>
            <span className="text-lg font-semibold tracking-tight">DevStash</span>
          </div>
          <div className="lg:hidden" />
        </div>

        <div className="relative min-w-0 lg:mx-auto lg:w-full lg:max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            readOnly
            role="button"
            aria-label="Open global search"
            aria-haspopup="dialog"
            placeholder="Search items and collections... (⌘K)"
            className="cursor-pointer pl-9"
            onClick={openSearch}
            onFocus={(event) => {
              event.target.blur();
              openSearch();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSearch();
              }
            }}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="shrink-0"
          >
            <Link href="/favorites" aria-label="Open favorites">
              <Star className="size-4" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 lg:w-auto"
            onClick={onCreateCollection}
          >
            <FolderPlus className="size-4" />
            New Collection
          </Button>
          <Button
            type="button"
            className="w-full shrink-0 lg:w-auto"
            onClick={onCreateItem}
          >
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </div>
    </header>
  );
};
