import { Plus, Search, SquareStack } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const TopBar = () => {
  return (
    <header className="border-b border-border/70">
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <SquareStack className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">DevStash</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search items"
            placeholder="Search items..."
            className="pl-9"
          />
        </div>

        <Button type="button" className="w-full lg:w-auto">
          <Plus className="size-4" />
          New Item
        </Button>
      </div>
    </header>
  );
};
