"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { itemTypeIcons, resolveItemIcon } from "@/lib/icons";
import { getColorClasses } from "@/lib/color-utils";
import { DashboardCollectionCard } from "@/components/collections/DashboardCollectionCard";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { togglePinItem } from "@/actions/items";
import type { DashboardItem, DashboardItemType } from "@/types/items";
import type { DashboardStat } from "@/components/dashboard/DashboardStats";

type CollectionSummary = {
  id: string;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
  itemCount: number;
  lastUpdatedAt: string | null;
  dominantColor?: string;
  typeIcons?: string[];
};

function formatRelativeDateLabel(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const [year, month, day] = value.split("-").map(Number);
  const currentDate = new Date(2026, 0, 16);
  const targetDate = new Date(year, month - 1, day);
  const diffInDays = Math.max(
    0,
    Math.round(
      (currentDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  if (diffInDays === 0) {
    return "Updated today";
  }

  if (diffInDays === 1) {
    return "Updated 1 day ago";
  }

  return `Updated ${diffInDays} days ago`;
}

type DashboardMainContentProps = {
  userName: string;
  collectionCount: number;
  itemCount: number;
  itemTypeCount: number;
  fetchError: string | null;
  stats: DashboardStat[];
  mainRecentCollections: CollectionSummary[];
  pinnedItems: DashboardItem[];
  recentItems: DashboardItem[];
  itemTypeById: Record<string, DashboardItemType>;
  setDrawerItemId: (id: string | null) => void;
  setPinningItemId: (id: string | null) => void;
  pinningItemId: string | null;
};

export function DashboardMainContent({
  userName,
  collectionCount,
  itemCount,
  itemTypeCount,
  fetchError,
  stats,
  mainRecentCollections,
  pinnedItems,
  recentItems,
  itemTypeById,
  setDrawerItemId,
  setPinningItemId,
  pinningItemId,
}: DashboardMainContentProps) {
  const router = useRouter();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Welcome back, {userName}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Dashboard
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Your developer knowledge hub with {collectionCount} collections,{" "}
          {itemCount} items, and {itemTypeCount} built-in item
          types.
        </p>
      </div>

      {fetchError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="text-sm font-medium text-red-400">
            Could not load dashboard data. The API may still be starting up.
          </p>
          <p className="mt-1 text-xs text-red-400/60">
            {fetchError}
          </p>
          <Link
            href="/api/auth/signout-all"
            className="mt-2 inline-block text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign out and try signing in again &rarr;
          </Link>
        </div>
      ) : null}

      <DashboardStats stats={stats} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Recent collections
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                Jump back into the collections that changed most recently.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground sm:inline-flex">
              {mainRecentCollections.length} visible
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {mainRecentCollections.map((collection) => (
              <DashboardCollectionCard
                key={collection.id}
                collection={collection}
                lastUpdatedLabel={formatRelativeDateLabel(collection.lastUpdatedAt)}
                typeIconComponents={
                  collection.typeIcons && collection.typeIcons.length > 0 ? (
                    <div className="inline-flex items-center gap-1">
                      {collection.typeIcons.map((iconName) => {
                        const Icon = resolveItemIcon(iconName);
                        return (
                          <span
                            key={`${collection.id}-${iconName}`}
                            className="inline-flex size-6 items-center justify-center rounded-full border border-border/70 text-muted-foreground"
                          >
                            <Icon className="size-3.5" />
                          </span>
                        );
                      })}
                    </div>
                  ) : null
                }
              />
            ))}
          </div>
        </section>

        {pinnedItems.length > 0 ? (
          <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Pinned items
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Quick access to the items you pinned for daily work.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground sm:inline-flex">
                {pinnedItems.length} pinned
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {pinnedItems.map((item) => {
                const itemType = itemTypeById[item.typeId];
                const ItemTypeIcon = itemType ? itemTypeIcons[itemType.icon] : resolveItemIcon(null);

                return (
                  <article
                    key={item.id}
                    onClick={() => setDrawerItemId(item.id)}
                    className="rounded-3xl border border-border/70 bg-background/70 p-5 cursor-pointer hover:bg-background/90 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={cn(
                          "flex size-11 items-center justify-center rounded-2xl border",
                          getColorClasses(itemType?.color ?? "slate"),
                        )}
                      >
                        <ItemTypeIcon className="size-5" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPinningItemId(item.id);
                          togglePinItem(item.id).then((result) => {
                            if (result.success === true) {
                              router.refresh();
                              if (result.data) {
                                toast.success("Item pinned");
                              } else {
                                toast.success("Item unpinned");
                              }
                            } else {
                              toast.error(result.error ?? "Failed to toggle pin");
                            }
                            setPinningItemId(null);
                          });
                        }}
                        disabled={pinningItemId === item.id}
                        className="rounded-lg p-1 hover:bg-muted transition-colors"
                        aria-label="Unpin"
                      >
                        <Pin className="size-4 fill-sky-400 text-sky-400" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">
                        {itemType?.label ?? "Item"}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Recent items
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              The 10 most recently updated resources across your workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm font-medium text-muted-foreground">
            {recentItems.length} items shown
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-border/70">
          <div className="divide-y divide-border/70 bg-background/70">
            {recentItems.map((item, index) => {
              const itemType = itemTypeById[item.typeId];
              const ItemTypeIcon = itemType ? itemTypeIcons[itemType.icon] : resolveItemIcon(null);

              return (
                <article
                  key={item.id}
                  onClick={() => setDrawerItemId(item.id)}
                  className="grid gap-4 px-4 py-4 sm:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,0.9fr)_auto] sm:items-center sm:px-6 cursor-pointer hover:bg-background/90 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-sm font-medium text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-2xl border",
                        getColorClasses(itemType?.color ?? "slate"),
                      )}
                    >
                      <ItemTypeIcon className="size-4" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{item.title}</h3>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>

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

                  <div className="text-sm text-muted-foreground sm:text-right">
                    {formatRelativeDateLabel(item.updatedAt)}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
