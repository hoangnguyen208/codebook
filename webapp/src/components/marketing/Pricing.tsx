"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-3">
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

      <div className="grid gap-6 lg:grid-cols-2 max-w-2xl mx-auto">
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

          <Link
            href="/api/auth/register?callbackUrl=%2Fdashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "mt-6 w-full"
            )}
          >
            Get Started Free
          </Link>
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
              {yearly ? "/year" : "/month"}
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

          <Link
            href="/api/auth/register?callbackUrl=%2Fdashboard&plan=pro"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 w-full bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            Get Started Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
