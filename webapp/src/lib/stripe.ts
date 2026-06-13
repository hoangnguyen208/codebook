import "server-only";
import Stripe from "stripe";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return key;
}

const _stripeInstances = new Map<string, Stripe>();

function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  const existing = _stripeInstances.get(key);
  if (existing) return existing;
  const instance = new Stripe(key, {
    typescript: true,
  });
  _stripeInstances.set(key, instance);
  return instance;
}

function getPriceId(plan: "monthly" | "yearly"): string {
  const envKey =
    plan === "monthly" ? "STRIPE_PRICE_ID_MONTHLY" : "STRIPE_PRICE_ID_YEARLY";
  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured.`);
  }
  return priceId;
}

export { getStripeClient, getStripeSecretKey, getPriceId };
