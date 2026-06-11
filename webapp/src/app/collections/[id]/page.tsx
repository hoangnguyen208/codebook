import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";

import { auth } from "@/auth";
import { getDashboardCollections } from "@/lib/db/collections";
import { getItemsByCollection } from "@/lib/db/items";
import { ItemsGridClient } from "@/components/items/ItemsGridClient";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export default async function CollectionItemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const accessToken = session?.accessToken;

  let collections: Awaited<ReturnType<typeof getDashboardCollections>> = [];
  let items: Awaited<ReturnType<typeof getItemsByCollection>> = [];
  let fetchError: string | null = null;

  try {
    [collections, items] = await Promise.all([
      getDashboardCollections(500, { accessToken }),
      getItemsByCollection(id, { accessToken }),
    ]);
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Failed to fetch collection data";
    console.error("[CollectionItems] fetch failed:", fetchError);
  }

  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    if (fetchError) {
      return (
        <main className="min-h-screen bg-background">
          <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
              <p className="text-sm font-medium text-red-400">
                Could not load collection. The API may still be starting up.
              </p>
              <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
            </div>
          </section>
        </main>
      );
    }
    notFound();
  }

  const dominantColor = collection.dominantColor || "slate";
  const typeColorClass = colorClasses[dominantColor] ?? colorClasses.slate;

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/collections"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            Back to collections
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl border",
              typeColorClass,
            )}
          >
            <FolderOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {collection.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {collection.description
                ? `${collection.description} · `
                : ""}
              {items.length} {items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <ItemsGridClient
          items={items}
          itemTypeIconName="file-text"
          itemTypeColorClasses={typeColorClass}
          itemTypeBorderColorClass="border-l-border/70"
          itemTypeLabel="Item"
          typeName=""
        />
        {fetchError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm font-medium text-red-400">
              Some data may be incomplete. The API may still be starting up.
            </p>
            <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
