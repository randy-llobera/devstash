import type { ReactNode } from "react";
import Link from "next/link";
import { FolderPlus, Plus, Search, Star } from "lucide-react";

import { useSearch } from "@/components/dashboard/search-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TopBarProps {
  isPro: boolean;
  mobileSidebar: ReactNode;
  onCreateCollection: () => void;
  onCreateItem: () => void;
}

export const TopBar = ({
  isPro,
  mobileSidebar,
  onCreateCollection,
  onCreateItem,
}: TopBarProps) => {
  const { openSearch } = useSearch();

  return (
    <header className="border-b border-border/70">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
          <div className="flex items-center justify-between gap-3 xl:justify-start">
            <div className="flex items-center gap-3">
              <div className="xl:hidden">{mobileSidebar}</div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  DS
                </div>
                <span className="text-lg font-semibold tracking-tight">DevStash</span>
              </div>
            </div>
            <div className="xl:hidden" />
          </div>

          <div className="relative min-w-0 xl:mx-auto xl:w-full xl:max-w-xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              role="button"
              aria-label="Open global search"
              aria-haspopup="dialog"
              placeholder="Search items and collections... (⌘K)"
              className="h-11 cursor-pointer pl-9"
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

          <div className="flex flex-wrap items-center gap-2 sm:justify-end xl:flex-nowrap">
            {!isPro ? (
              <Button asChild variant="ghost" className="w-full shrink-0 sm:w-auto">
                <Link href="/upgrade">Upgrade</Link>
              </Button>
            ) : null}
            <Button
              asChild
              variant="outline"
              size="icon"
              className="size-11 shrink-0"
            >
              <Link href="/favorites" aria-label="Open favorites">
                <Star className="size-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full shrink-0 sm:w-auto"
              onClick={onCreateCollection}
            >
              <FolderPlus className="size-4" />
              New Collection
            </Button>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              onClick={onCreateItem}
            >
              <Plus className="size-4" />
              New Item
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
