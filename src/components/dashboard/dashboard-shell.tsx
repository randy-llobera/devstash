'use client';

import { useState, type ReactNode } from 'react';

import type { SidebarCollection } from '@/lib/db/collections';
import type { DashboardUser } from '@/lib/db/dashboard-user';
import type { SidebarItemType } from '@/lib/db/items';

import { cn } from '@/lib/utils';

import { CreateItemDialog } from '@/components/dashboard/create-item-dialog';
import { ItemDrawerProvider } from '@/components/dashboard/item-drawer-provider';
import { TopBar } from '@/components/layout/top-bar';
import { MobileSidebarTrigger } from '@/components/layout/mobile-sidebar-trigger';
import { Sidebar } from '@/components/layout/sidebar';

interface DashboardShellProps {
  user: DashboardUser | null;
  itemTypes: SidebarItemType[];
  favoriteCollections: SidebarCollection[];
  recentCollections: SidebarCollection[];
  children: ReactNode;
}

export const DashboardShell = ({
  user,
  itemTypes,
  favoriteCollections,
  recentCollections,
  children,
}: DashboardShellProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <ItemDrawerProvider>
      <main className='min-h-screen bg-background text-foreground'>
        <div className='grid min-h-screen grid-rows-[auto_1fr]'>
          <TopBar
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
      <CreateItemDialog
        itemTypes={itemTypes}
        onOpenChange={setIsCreateDialogOpen}
        open={isCreateDialogOpen}
      />
    </ItemDrawerProvider>
  );
};
