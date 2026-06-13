"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Props = {
  isPro: boolean;
  itemCount: number;
  collectionCount: number;
};

const ITEM_LIMIT = 50;
const COLLECTION_LIMIT = 3;

function UpgradeToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      toast.success("Welcome to CodeBook Pro!");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams]);

  return null;
}

export function BillingSettings({ isPro, itemCount, collectionCount }: Props) {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingYearly, setLoadingYearly] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const isLoading = loadingMonthly || loadingYearly || loadingPortal;

  async function handleUpgrade(plan: "monthly" | "yearly") {
    if (plan === "monthly") setLoadingMonthly(true);
    else setLoadingYearly(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings?upgraded=true&tab=billing`,
          cancelUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Checkout failed");
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      if (plan === "monthly") setLoadingMonthly(false);
      else setLoadingYearly(false);
    }
  }

  async function handleManageBilling() {
    setLoadingPortal(true);

    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings?tab=billing`,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Portal failed");
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <UpgradeToast />
      </Suspense>

      <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold">Billing</h2>
        </div>

        <div className="rounded-2xl border border-border/50 bg-muted/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-semibold">{isPro ? "Pro" : "Free"}</span>
                {isPro && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                    <Sparkles className="size-3" />
                    Pro
                  </span>
                )}
              </div>
            </div>

            {isPro ? (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingPortal && <Loader2 className="size-4 animate-spin" />}
                Manage Billing
              </button>
            ) : null}
          </div>

          {!isPro && (
            <>
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-muted-foreground">
                <span>{itemCount}/{ITEM_LIMIT} items</span>
                <span>{collectionCount}/{COLLECTION_LIMIT} collections</span>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleUpgrade("monthly")}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingMonthly && <Loader2 className="size-4 animate-spin" />}
                  Upgrade $8/mo
                </button>
                <button
                  type="button"
                  onClick={() => handleUpgrade("yearly")}
                  disabled={isLoading}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingYearly && <Loader2 className="size-4 animate-spin" />}
                  Upgrade $72/yr (save 25%)
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
