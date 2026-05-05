import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderOpen } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mockDashboardData } from "@/lib/mock-data";

export function generateStaticParams() {
  return mockDashboardData.itemTypes.map((itemType) => ({
    type: itemType.name,
  }));
}

export default async function ItemsByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const itemType = mockDashboardData.itemTypes.find(
    (candidate) => candidate.name === type,
  );

  if (!itemType) {
    notFound();
  }

  const matchingItems = mockDashboardData.items.filter(
    (item) => item.typeId === itemType.id,
  );
  const collectionCount = new Set(matchingItems.map((item) => item.collectionId)).size;

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

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Item type route
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {itemType.label}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            This phase adds working routes for dashboard item types. The{" "}
            {itemType.label.toLowerCase()} category currently includes{" "}
            {matchingItems.length} items across {collectionCount} collections.
          </p>
        </div>

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
              <FolderOpen className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Recent {itemType.label.toLowerCase()}
              </h2>
              <p className="text-sm text-muted-foreground">
                Mock data rendered from the current dashboard dataset.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {matchingItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border/70 bg-background/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">{item.title}</h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="shrink-0 text-sm text-muted-foreground">
                    {item.updatedAt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
