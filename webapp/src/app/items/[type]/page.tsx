import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Code2, File, FileImage, FileText, Link2, Sparkles, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { auth } from "@/auth";
import { ItemsGridClient } from "@/components/items/ItemsGridClient";
import { Pagination } from "@/components/Pagination";
import { buttonVariants } from "@/components/ui/button";
import { getItemsByType, getSystemDashboardItemTypes } from "@/lib/db/items";
import type { DashboardItemType } from "@/types/items";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRO_ONLY_TYPES = new Set(["file", "image"]);

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
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { type } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();
  const accessToken = session?.accessToken;
  const isPro = session?.user?.isPro ?? false;

  if (PRO_ONLY_TYPES.has(type) && !isPro) {
    redirect("/upgrade");
  }

  let itemTypes: Awaited<ReturnType<typeof getSystemDashboardItemTypes>> = [];
  let result: Awaited<ReturnType<typeof getItemsByType>> = { items: [], totalCount: 0, page: 1, pageSize: 21 };
  let fetchError: string | null = null;

  try {
    [itemTypes, result] = await Promise.all([
      getSystemDashboardItemTypes({ accessToken }),
      getItemsByType(type, { accessToken, page, pageSize: 5 }),
    ]);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Failed to fetch item types";
    console.error("[ItemsByType] fetch failed:", fetchError);
  }

  const itemType = itemTypes.find((candidate) => candidate.name === type);

  if (!itemType) {
    if (fetchError) {
      return (
        <main className="min-h-screen bg-background">
          <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
              <p className="text-sm font-medium text-red-400">Could not load data. The API may still be starting up.</p>
              <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
            </div>
          </section>
        </main>
      );
    }
    notFound();
  }

  const Icon = itemTypeIcons[itemType.icon] ?? FileText;
  const typeColorClasses = colorClasses[itemType.color] ?? "border-border bg-muted text-muted-foreground";
  const typeBorderColorClass = borderColorClasses[itemType.color] ?? "border-l-border/70";
  const totalPages = Math.ceil(result.totalCount / result.pageSize);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn("flex size-12 items-center justify-center rounded-2xl border", typeColorClasses)}>
            <Icon className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{itemType.label}</h1>
            <p className="text-sm text-muted-foreground">{result.totalCount} {result.totalCount === 1 ? "item" : "items"}</p>
          </div>
        </div>

        <ItemsGridClient
          items={result.items}
          itemTypeIconName={itemType.icon}
          itemTypeColorClasses={typeColorClasses}
          itemTypeBorderColorClass={typeBorderColorClass}
          itemTypeLabel={itemType.label.slice(0, -1)}
          typeName={type}
          isPro={isPro}
        />
        {fetchError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm font-medium text-red-400">Some data may be incomplete. The API may still be starting up.</p>
            <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
          </div>
        ) : null}
        <Pagination currentPage={page} totalPages={totalPages} />
      </section>
    </main>
  );
}
