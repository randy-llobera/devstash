import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-03-25.dahlia";

let stripeClient: Stripe | null = null;

export const getStripeSecretKey = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required to initialize Stripe.");
  }

  return secretKey;
};

export const getStripePublishableKey = () => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    throw new Error("STRIPE_PUBLISHABLE_KEY is not configured.");
  }

  return publishableKey;
};

export const getStripe = () => {
  if (stripeClient) {
    return stripeClient;
  }

  stripeClient = new Stripe(getStripeSecretKey(), {
    apiVersion: STRIPE_API_VERSION,
    appInfo: {
      name: "DevStash",
    },
  });

  return stripeClient;
};
