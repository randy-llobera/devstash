"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { TopBar } from "@/components/layout/top-bar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { Sidebar } from "@/components/layout/sidebar";

interface DashboardShellProps {
  children: ReactNode;
}

export const DashboardShell = ({ children }: DashboardShellProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-rows-[auto_1fr]">
        <TopBar mobileSidebar={<MobileSidebarTrigger />} />

        <div
          className={cn(
            "grid min-h-0",
            isSidebarCollapsed
              ? "lg:grid-cols-[5rem_minmax(0,1fr)]"
              : "lg:grid-cols-[18rem_minmax(0,1fr)]"
          )}
        >
          <Sidebar
            collapsed={isSidebarCollapsed}
            className="hidden lg:flex"
            onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
          />

          <section className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
              {children}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};
