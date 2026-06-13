"use client";

import { useState } from "react";
import { Check, Sparkles, Zap, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const freeFeatures = [
  "50 items",
  "3 collections",
  "Basic full-text search",
  "All item types",
  "Community support",
];

const proFeatures = [
  "Unlimited items",
  "Unlimited collections",
  "AI-powered tag generation",
  "AI summarization",
  "AI commit message generation",
  "AI description generation",
  "50MB file uploads",
  "Priority support",
];

type Props = {
  isPro: boolean;
};

export function UpgradeClient({ isPro }: Props) {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isPro) {
    return (
      <main className="min-h-screen bg-background">
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
          <div className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-blue-500/20 bg-card px-8 py-20 text-center shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-500/10">
              <Sparkles className="size-7 text-amber-400" />
            </div>
            <h1 className="text-2xl font-semibold">You&apos;re already on Pro!</h1>
            <p className="text-sm text-muted-foreground max-w-md">
              Manage your subscription or switch plans from the billing settings.
            </p>
            <Link
              href="/settings?tab=billing"
              className={cn(buttonVariants({ variant: "default" }), "bg-blue-500 hover:bg-blue-600 text-white")}
            >
              Manage Billing
            </Link>
          </div>
        </section>
      </main>
    );
  }

  async function handleUpgrade() {
    setLoading(true);
    const plan = yearly ? "yearly" : "monthly";

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings?upgraded=true&tab=billing`,
          cancelUrl: `${window.location.origin}/upgrade`,
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
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "self-start")}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Upgrade to Pro</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Unlock unlimited items, AI features, file uploads, and more.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              "text-sm font-medium transition-colors",
              !yearly ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Monthly
          </button>

          <button
            onClick={() => setYearly((y) => !y)}
            role="switch"
            aria-checked={yearly}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              yearly ? "bg-blue-500" : "bg-muted-foreground/30"
            )}
          >
            <span
              className={cn(
                "pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform",
                yearly ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>

          <button
            onClick={() => setYearly(true)}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors",
              yearly ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Yearly
            <span className="rounded-full bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">
              Save 25%
            </span>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-2xl mx-auto w-full">
          {/* Free Card */}
          <div className="rounded-xl border border-border/40 bg-card/40 p-6">
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">$0</span>
              <span className="text-sm text-muted-foreground">/forever</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Check className="size-4 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-border/40 px-4 py-3 text-center text-sm text-muted-foreground">
              Current plan
            </div>
          </div>

          {/* Pro Card */}
          <div className="relative rounded-xl border-2 border-blue-500/50 bg-card/40 p-6">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-0.5 text-xs font-semibold text-white">
              Most Popular
            </span>

            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Pro</h3>
              <Sparkles className="size-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {yearly ? "$72" : "$8"}
              </span>
              <span className="text-sm text-muted-foreground">
                {yearly ? "/year" : "$8/mo billed annually"}
              </span>
            </div>

            <ul className="mt-6 space-y-2.5">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Zap className="size-4 text-amber-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-6 w-full bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading && <Loader2 className="size-4 animate-spin mr-2" />}
              Upgrade {yearly ? "$72/yr" : "$8/mo"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
