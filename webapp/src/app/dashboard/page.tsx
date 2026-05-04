import { PanelsTopLeft, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { mockDashboardData } from "../../../lib/mock-data";

export default function DashboardPage() {
  const { user, collections, itemTypes, items } = mockDashboardData;
  const favoriteCollections = collections.filter(
    (collection) => collection.isFavorite,
  );
  const pinnedItems = items.filter((item) => item.isPinned);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
            <PanelsTopLeft className="size-4" />
          </div>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search items"
              placeholder="Search items..."
              className="h-11 rounded-xl border-border/70 bg-card pl-10 shadow-none"
            />
          </div>

          <Button size="lg" className="h-11 rounded-xl px-4">
            <Plus className="size-4" />
            New Item
          </Button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Welcome back, {user.name}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Dashboard
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
            Your developer knowledge hub with {collections.length} collections,{" "}
            {items.length} items, and {itemTypes.length} built-in item types.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">Sidebar</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Placeholder for filters, item types, and collections. {user.name}{" "}
              currently has {favoriteCollections.length} favorite collections.
            </p>
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">Main</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Placeholder for dashboard content and collection cards. There are{" "}
              {pinnedItems.length} pinned items ready for the next phase.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
