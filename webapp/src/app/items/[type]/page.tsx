import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Code2, File, FileImage, FileText, Link2, Sparkles, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { auth } from "@/auth";
import { ItemsGridClient } from "@/components/items/ItemsGridClient";
import { buttonVariants } from "@/components/ui/button";
import { getItemsByType, getSystemDashboardItemTypes } from "@/lib/db/items";
import type { DashboardItemType } from "@/types/items";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const itemTypeIcons: Record<DashboardItemType["icon"], LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "file-text": FileText,
  file: File,
  image: FileImage,
  link: Link2,
};

const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const borderColorClasses: Record<string, string> = {
  blue: "border-l-blue-500/40",
  purple: "border-l-purple-500/40",
  orange: "border-l-orange-500/40",
  yellow: "border-l-yellow-500/40",
  slate: "border-l-slate-500/40",
  pink: "border-l-pink-500/40",
  emerald: "border-l-emerald-500/40",
};

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const session = await auth();
  const accessToken = session?.accessToken;

  const itemTypes = await getSystemDashboardItemTypes({ accessToken });
  const itemType = itemTypes.find(
    (candidate) => candidate.name === type,
  );

  if (!itemType) {
    notFound();
  }

  const items = await getItemsByType(type, { accessToken });
  const Icon = itemTypeIcons[itemType.icon] ?? FileText;
  const typeColorClasses = colorClasses[itemType.color] ?? "border-border bg-muted text-muted-foreground";
  const typeBorderColorClass = borderColorClasses[itemType.color] ?? "border-l-border/70";

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl border",
              typeColorClasses,
            )}
          >
            <Icon className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {itemType.label}
            </h1>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
            <p className="text-lg font-medium text-muted-foreground">
              No {itemType.label.toLowerCase()} yet
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first {itemType.label.toLowerCase().slice(0, -1)} to get started.
            </p>
          </section>
        ) : (
          <ItemsGridClient
            items={items}
            itemTypeIconName={itemType.icon}
            itemTypeColorClasses={typeColorClasses}
            itemTypeBorderColorClass={typeBorderColorClass}
            itemTypeLabel={itemType.label.slice(0, -1)}
          />
        )}
      </section>
    </main>
  );
}
