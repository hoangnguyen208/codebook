import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { auth } from "@/auth";
import { getDashboardCollections } from "@/lib/db/collections";
import { Pagination } from "@/components/Pagination";
import { buttonVariants } from "@/components/ui/button";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();
  const accessToken = session?.accessToken;

  let result: Awaited<ReturnType<typeof getDashboardCollections>> = { items: [], totalCount: 0, page: 1, pageSize: 21 };
  let fetchError: string | null = null;

  try {
    result = await getDashboardCollections({ accessToken, page, pageSize: 5 });
  } catch (error) {
    fetchError = error instanceof Error ? error.message : "Failed to fetch collections";
    console.error("[CollectionsPage] fetch failed:", fetchError);
  }

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

        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">All collections</h1>
          <p className="mt-2 text-sm text-muted-foreground">{result.totalCount} {result.totalCount === 1 ? "collection" : "collections"}</p>
        </div>

        {fetchError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <p className="text-sm font-medium text-red-400">Could not load collections. The API may still be starting up.</p>
            <p className="mt-1 text-xs text-red-400/60">{fetchError}</p>
          </div>
        ) : result.items.length === 0 ? (
          <section className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
            <p className="text-lg font-medium text-muted-foreground">No collections yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first collection from the dashboard to get started.</p>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} />
      </section>
    </main>
  );
}
