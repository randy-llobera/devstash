export const PRO_PLAN_NAME = "Pro";
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const PRO_PRICE_AMOUNT_CENTS: Record<BillingInterval, number> = {
  monthly: 800,
  yearly: 7200,
};

export const PRO_PRICE_LABELS: Record<BillingInterval, string> = {
  monthly: "$8/month",
  yearly: "$72/year",
};

const STRIPE_PRICE_ID_ENV_NAMES: Record<BillingInterval, string> = {
  monthly: "STRIPE_PRICE_ID_MONTHLY",
  yearly: "STRIPE_PRICE_ID_YEARLY",
};

export const STRIPE_PRICE_IDS: Record<BillingInterval, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
};

export const isBillingInterval = (value: string): value is BillingInterval =>
  BILLING_INTERVALS.includes(value as BillingInterval);

export const getStripePriceId = (interval: BillingInterval) => {
  const priceId = STRIPE_PRICE_IDS[interval];

  if (!priceId) {
    throw new Error(`${STRIPE_PRICE_ID_ENV_NAMES[interval]} is not configured.`);
  }

  return priceId;
};
