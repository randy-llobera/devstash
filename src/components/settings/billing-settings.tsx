"use client";

import { useMemo, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  FREE_TIER_COLLECTION_LIMIT,
  FREE_TIER_ITEM_LIMIT,
  PRO_PLAN_NAME,
  PRO_PRICE_LABELS,
  type BillingInterval,
} from "@/lib/billing-config";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingSettingsProps {
  collectionCount: number;
  isPro: boolean;
  itemCount: number;
  stripeCustomerId: string | null;
}

const BILLING_MESSAGES: Record<string, string> = {
  cancelled: "Checkout was cancelled. Your plan has not changed.",
  success: "Checkout completed. Refresh this page in a moment if your Pro access has not updated yet.",
  upgrade: "Upgrade to Pro to unlock file uploads, image uploads, and higher usage limits.",
};

const redirectToBillingUrl = async (path: string, body?: Record<string, string>) => {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; url?: string }
    | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error ?? "Unable to open billing.");
  }

  window.location.href = payload.url;
};

export const BillingSettings = ({
  collectionCount,
  isPro,
  itemCount,
  stripeCustomerId,
}: BillingSettingsProps) => {
  const searchParams = useSearchParams();
  const [pendingInterval, setPendingInterval] = useState<BillingInterval | null>(null);
  const [isOpeningPortal, startPortalTransition] = useTransition();
  const statusMessage = useMemo(() => {
    const billingState = searchParams.get("billing");

    return billingState ? BILLING_MESSAGES[billingState] ?? null : null;
  }, [searchParams]);

  const handleCheckout = (interval: BillingInterval) => {
    setPendingInterval(interval);

    void redirectToBillingUrl("/api/stripe/checkout", { interval })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Unable to start checkout.");
      })
      .finally(() => {
        setPendingInterval(null);
      });
  };

  const handlePortal = () => {
    startPortalTransition(async () => {
      try {
        await redirectToBillingUrl("/api/stripe/portal");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to open billing portal.");
      }
    });
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              Billing
            </CardTitle>
            <CardDescription>
              Manage your plan and the limits that gate item creation, collections, and uploads.
            </CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "outline"} className="w-fit rounded-full px-3 py-1">
            {isPro ? `${PRO_PLAN_NAME} active` : "Free plan"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {statusMessage ? (
          <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-background px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Current access
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {isPro
                  ? "Your account can create all item types and use the billing portal."
                  : "Free accounts can create text and link items, with capped item and collection counts."}
              </p>
            </div>

            {isPro ? (
              <Button
                type="button"
                variant="outline"
                onClick={handlePortal}
                disabled={isOpeningPortal || !stripeCustomerId}
              >
                {isOpeningPortal ? <LoaderCircle className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
                Manage billing
              </Button>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  onClick={() => handleCheckout("monthly")}
                  disabled={pendingInterval !== null}
                >
                  {pendingInterval === "monthly" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  Upgrade monthly
                  <span className="text-xs text-primary-foreground/80">
                    {PRO_PRICE_LABELS.monthly}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleCheckout("yearly")}
                  disabled={pendingInterval !== null}
                >
                  {pendingInterval === "yearly" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  Upgrade yearly
                  <span className="text-xs text-muted-foreground">
                    {PRO_PRICE_LABELS.yearly}
                  </span>
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">Usage summary</p>
              <p className="text-sm text-muted-foreground">
                Server-side gating uses these counts even if a UI control is hidden.
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                <div className="text-sm font-medium">Items</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {itemCount}
                  {isPro ? " total" : ` / ${FREE_TIER_ITEM_LIMIT} free`}
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                <div className="text-sm font-medium">Collections</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {collectionCount}
                  {isPro ? " total" : ` / ${FREE_TIER_COLLECTION_LIMIT} free`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
