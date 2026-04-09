import type { LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DashboardStatCardProps {
  label: string;
  value: number;
  helper: string;
  icon: LucideIcon;
}

export const DashboardStatCard = ({
  label,
  value,
  helper,
  icon: Icon,
}: DashboardStatCardProps) => {
  return (
    <Card className="border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-3">
          <CardDescription>{label}</CardDescription>
          <CardTitle className="text-3xl font-semibold tracking-tight">
            {value}
          </CardTitle>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/50 p-2.5 text-muted-foreground">
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
};
