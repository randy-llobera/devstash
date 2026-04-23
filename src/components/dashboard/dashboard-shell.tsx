'use client';

import { useState, type ReactNode } from 'react';

import type { CollectionOption, SidebarCollection } from '@/lib/db/collections';
import type { DashboardUser } from '@/lib/db/dashboard-user';
import type { SidebarItemType } from '@/lib/db/items';

import { cn } from '@/lib/utils';

import { CreateCollectionDialog } from '@/components/dashboard/create-collection-dialog';
import { CreateItemDialog } from '@/components/dashboard/create-item-dialog';
import { GlobalSearchDialog } from '@/components/dashboard/global-search-dialog';
import { ItemDrawerProvider } from '@/components/dashboard/item-drawer-provider';
import { SearchProvider } from '@/components/dashboard/search-provider';
import { TopBar } from '@/components/layout/top-bar';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { Sidebar } from '@/components/layout/sidebar';
import { EditorPreferencesProvider } from '@/contexts/editor-preferences-context';

interface DashboardShellProps {
  user: DashboardUser | null;
  collections: CollectionOption[];
  itemTypes: SidebarItemType[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
  children: ReactNode;
}

export const DashboardShell = ({
  user,
  collections,
  itemTypes,
  favoriteCollections,
  recentCollections,
  children,
}: DashboardShellProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateCollectionDialogOpen, setIsCreateCollectionDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <SearchProvider>
      <EditorPreferencesProvider
        initialPreferences={user?.editorPreferences}
      >
        <ItemDrawerProvider collections={collections} isPro={Boolean(user?.isPro)}>
          <main className='min-h-screen bg-background text-foreground'>
            <div className='grid min-h-screen grid-rows-[auto_1fr]'>
              <TopBar
                isPro={Boolean(user?.isPro)}
                onCreateCollection={() => setIsCreateCollectionDialogOpen(true)}
                onCreateItem={() => setIsCreateDialogOpen(true)}
                mobileSidebar={
                  <MobileSidebarTrigger
                    user={user}
                    itemTypes={itemTypes}
                    favoriteCollections={favoriteCollections}
                    recentCollections={recentCollections}
                  />
                }
              />
              <GlobalSearchDialog />

              <div
                className={cn(
                  'grid min-h-0',
                  isSidebarCollapsed
                    ? 'lg:grid-cols-[5rem_minmax(0,1fr)]'
                    : 'lg:grid-cols-[18rem_minmax(0,1fr)]',
                )}
              >
                <Sidebar
                  collapsed={isSidebarCollapsed}
                  user={user}
                  itemTypes={itemTypes}
                  favoriteCollections={favoriteCollections}
                  recentCollections={recentCollections}
                  className='hidden lg:flex'
                  onToggleCollapsed={() =>
                    setIsSidebarCollapsed((current) => !current)
                  }
                />

                <section className='min-h-0 flex-1 overflow-y-auto p-6 sm:p-8'>
                  <div className='mx-auto flex w-full max-w-7xl flex-col gap-8'>
                    {children}
                  </div>
                </section>
              </div>
            </div>
          </main>
          <CreateCollectionDialog
            onOpenChange={setIsCreateCollectionDialogOpen}
            open={isCreateCollectionDialogOpen}
          />
          <CreateItemDialog
            collections={collections}
            itemTypes={itemTypes}
            isPro={Boolean(user?.isPro)}
            onOpenChange={setIsCreateDialogOpen}
            open={isCreateDialogOpen}
          />
        </ItemDrawerProvider>
      </EditorPreferencesProvider>
    </SearchProvider>
  );
};
