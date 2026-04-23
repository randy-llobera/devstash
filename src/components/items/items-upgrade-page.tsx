"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { PRO_PRICE_LABELS, type BillingInterval } from "@/lib/billing-config";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemsUpgradePageProps {
  itemTypeLabel: string;
}

const redirectToCheckout = async (interval: BillingInterval) => {
  const response = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ interval }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; url?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Unable to start checkout.");
  }

  window.location.href = payload.url;
};

export const ItemsUpgradePage = ({ itemTypeLabel }: ItemsUpgradePageProps) => {
  const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);

  const handleUpgrade = (interval: BillingInterval) => {
    setPendingInterval(interval);

    void redirectToCheckout(interval)
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to start checkout.");
      })
      .finally(() => {
        setPendingInterval(null);
      });
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Lock className="size-4" />
          Pro-only access
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight">
          Upgrade to open {itemTypeLabel}
        </CardTitle>
        <CardDescription className="max-w-2xl text-base">
          {itemTypeLabel} are part of Pro. Upgrade to unlock file and image items, uploads, and
          the full {itemTypeLabel.toLowerCase()} library.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => handleUpgrade("monthly")}
          disabled={pendingInterval !== null}
        >
          {pendingInterval === "monthly" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Upgrade monthly
          <span className="text-xs text-primary-foreground/80">{PRO_PRICE_LABELS.monthly}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleUpgrade("yearly")}
          disabled={pendingInterval !== null}
        >
          {pendingInterval === "yearly" ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Upgrade yearly
          <span className="text-xs text-muted-foreground">{PRO_PRICE_LABELS.yearly}</span>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/items/snippets">Go to snippets</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
