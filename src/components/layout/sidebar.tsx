"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  File,
  Folder,
  ImageIcon,
  LinkIcon,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Star,
  Terminal,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { mockDashboardData } from "@/lib/mock-data";

interface SidebarProps {
  collapsed?: boolean;
  mobile?: boolean;
  className?: string;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
}

const ICON_MAP = {
  "code-2": Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "notebook-pen": NotebookPen,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
} as const;

const ICON_COLOR_MAP = {
  blue: "text-blue-400",
  slate: "text-slate-400",
  yellow: "text-yellow-300",
  orange: "text-orange-400",
  purple: "text-violet-400",
  pink: "text-pink-400",
  green: "text-emerald-400",
} as const;

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const getRecentCollections = () => {
  return mockDashboardData.collections
    .map((collection) => {
      const updatedAt = mockDashboardData.items
        .filter((item) => item.collectionId === collection.id)
        .map((item) => item.updatedAt)
        .sort((left, right) => right.localeCompare(left))[0];

      return {
        ...collection,
        updatedAt,
      };
    })
    .filter((collection) => collection.updatedAt)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 4);
};

const itemTypes = mockDashboardData.itemTypes;
const favoriteCollections = mockDashboardData.collections.filter(
  (collection) => collection.isFavorite
);
const recentCollections = getRecentCollections();

export const Sidebar = ({
  collapsed = false,
  mobile = false,
  className,
  onNavigate,
  onToggleCollapsed,
}: SidebarProps) => {
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-border/70 bg-card/30 transition-[width] duration-200",
        mobile ? "w-full" : collapsed ? "w-20" : "w-72",
        className
      )}
    >
      <div className="border-b border-border/70 px-3 py-3">
        {collapsed && !mobile ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium tracking-tight text-foreground">
              Navigation
            </span>
            {mobile ? null : (
              <button
                type="button"
                onClick={onToggleCollapsed}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <section className="space-y-2">
          {collapsed && !mobile ? null : (
            <div className="px-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Types
            </div>
          )}
          <nav className="space-y-1">
            {itemTypes.map((itemType) => {
              const Icon =
                ICON_MAP[itemType.icon as keyof typeof ICON_MAP] ?? Folder;
              const iconColor =
                ICON_COLOR_MAP[itemType.color as keyof typeof ICON_COLOR_MAP] ??
                "text-muted-foreground";

              return (
                <Link
                  key={itemType.id}
                  href={`/items/${itemType.slug}`}
                  onClick={onNavigate}
                  title={itemType.name}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
                    collapsed && !mobile && "justify-center px-2"
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", iconColor)} />
                  {collapsed && !mobile ? null : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{itemType.name}</span>
                      <span className="text-xs text-muted-foreground/80">
                        {itemType.count}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>
        </section>

        {collapsed && !mobile ? null : (
          <section className="space-y-2 border-t border-border/70 pt-5">
            <button
              type="button"
              onClick={() => setIsCollectionsOpen((current) => !current)}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:bg-muted/70"
            >
              <span className="flex-1 text-left">Collections</span>
              {isCollectionsOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </button>

            {isCollectionsOpen ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                    Favorites
                  </div>
                  <div className="space-y-1">
                    {favoriteCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        href="#"
                        onClick={onNavigate}
                        title={collection.name}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted/70"
                      >
                        <Folder className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                        <Star className="size-3.5 fill-current text-yellow-400" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
                    Recent
                  </div>
                  <div className="space-y-1">
                    {recentCollections.map((collection) => (
                      <Link
                        key={collection.id}
                        href="#"
                        onClick={onNavigate}
                        title={collection.name}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
                      >
                        <Folder className="size-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{collection.name}</span>
                        <span className="text-xs text-muted-foreground/80">
                          {collection.itemCount}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        )}
      </div>

      <div className="mt-auto border-t border-border/70 p-3">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/70",
            collapsed && !mobile && "justify-center px-2"
          )}
        >
          <Avatar size="default">
            <AvatarFallback>{getInitials(mockDashboardData.user.name)}</AvatarFallback>
          </Avatar>
          {collapsed && !mobile ? null : (
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {mockDashboardData.user.name}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {mockDashboardData.user.email}
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};
