import { File, Folder, Pin, Star } from "lucide-react";

import type { MockDashboardData } from "@/lib/mock-data";

import { DashboardStatCard } from "@/components/dashboard/dashboard-stat-card";

interface DashboardStatsProps {
  data: MockDashboardData;
}

export const DashboardStats = ({ data }: DashboardStatsProps) => {
  const stats = [
    {
      label: "Items",
      value: data.items.length,
      helper: "Across your dashboard library",
      icon: File,
    },
    {
      label: "Collections",
      value: data.collections.length,
      helper: "Organized by project or topic",
      icon: Folder,
    },
    {
      label: "Favorite Items",
      value: data.items.filter((item) => item.isFavorite).length,
      helper: "Saved for quick access",
      icon: Star,
    },
    {
      label: "Favorite Collections",
      value: data.collections.filter((collection) => collection.isFavorite).length,
      helper: "Your most-used collection groups",
      icon: Pin,
    },
  ] as const;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardStatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
};
