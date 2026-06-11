import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { getFavorites } from "@/lib/db/favorites";
import { getSystemDashboardItemTypes } from "@/lib/db/items";
import { FavoritesList } from "@/components/items/FavoritesList";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  const accessToken = session?.accessToken;

  let itemsCount = 0;
  let collectionsCount = 0;
  let fetchError: string | null = null;

  let itemsResult: Awaited<ReturnType<typeof getFavorites>> = { items: [], collections: [] };
  const itemTypesResult: Record<string, { icon: string | null; name: string; color: string | null }> = {};

  try {
    const [favorites, itemTypes] = await Promise.all([
      getFavorites({ accessToken }),
      getSystemDashboardItemTypes({ accessToken }),
    ]);

    itemsResult = favorites;
    itemsCount = favorites.items.length;
    collectionsCount = favorites.collections.length;

    for (const t of itemTypes) {
      itemTypesResult[t.id] = { icon: t.icon, name: t.name, color: t.color };
    }
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Failed to fetch favorites";
    console.error("[FavoritesPage] fetch failed:", fetchError);
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Favorites</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {itemsCount} {itemsCount === 1 ? "item" : "items"}, {collectionsCount} {collectionsCount === 1 ? "collection" : "collections"}
          </p>
        </div>

        {fetchError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm font-medium text-red-400">Could not load favorites. The API may still be starting up.</p>
            <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
          </div>
        ) : itemsCount === 0 && collectionsCount === 0 ? (
          <section className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
            <p className="text-lg font-medium text-muted-foreground">No favorites yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Star items and collections to see them here.</p>
          </section>
        ) : (
          <FavoritesList
            items={itemsResult.items}
            collections={itemsResult.collections}
            itemTypeMap={itemTypesResult}
          />
        )}
      </section>
    </main>
  );
}
