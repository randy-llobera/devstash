"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { TopBar } from "@/components/layout/top-bar";
import { MobileSidebarTrigger } from "@/components/layout/mobile-sidebar-trigger";
import { Sidebar } from "@/components/layout/sidebar";

const DashboardPage = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen grid-rows-[auto_1fr]">
        <TopBar
          mobileSidebar={<MobileSidebarTrigger />}
        />

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

          <section className="min-h-0 flex-1 p-6 sm:p-8">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Your developer knowledge hub
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
