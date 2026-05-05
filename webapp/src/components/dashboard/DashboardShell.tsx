"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Code2,
  File,
  FileImage,
  FileText,
  FolderOpen,
  Link2,
  Menu,
  PanelsTopLeft,
  Plus,
  Search,
  Sparkles,
  Star,
  Terminal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  MockCollection,
  MockItem,
  MockItemType,
  MockUser,
} from "@/lib/mock-data";

type DashboardShellProps = {
  data: {
    user: MockUser;
    itemTypes: MockItemType[];
    collections: MockCollection[];
    items: MockItem[];
  };
};

type CollectionSummary = MockCollection & {
  itemCount: number;
  lastUpdatedAt: string | null;
};

const itemTypeIcons: Record<MockItemType["icon"], LucideIcon> = {
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

function getColorClasses(color: string) {
  return colorClasses[color] ?? "border-border bg-muted text-muted-foreground";
}

function formatPlanLabel(plan: MockUser["plan"]) {
  return plan === "pro" ? "Pro plan" : "Free plan";
}

function SidebarSectionLabel({
  children,
  isExpanded,
}: {
  children: string;
  isExpanded: boolean;
}) {
  if (!isExpanded) {
    return null;
  }

  return (
    <p className="px-3 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function DashboardSidebar({
  itemTypes,
  itemCountByType,
  favoriteCollections,
  recentCollections,
  user,
  pathname,
  isExpanded,
  onNavigate,
}: {
  itemTypes: MockItemType[];
  itemCountByType: Record<string, number>;
  favoriteCollections: CollectionSummary[];
  recentCollections: CollectionSummary[];
  user: MockUser;
  pathname: string;
  isExpanded: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-20 items-center border-b border-sidebar-border/70 px-4",
          isExpanded ? "gap-3" : "justify-center",
        )}
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/20">
          <PanelsTopLeft className="size-5" />
        </div>

        {isExpanded ? (
          <div className="min-w-0">
            <p className="truncate text-2xl font-semibold tracking-tight">CodeBook</p>
            <p className="text-sm text-sidebar-foreground/70">Developer knowledge hub</p>
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div className="space-y-2">
          <SidebarSectionLabel isExpanded={isExpanded}>Types</SidebarSectionLabel>
          <nav className="space-y-1">
            {itemTypes.map((itemType) => {
              const Icon = itemTypeIcons[itemType.icon];
              const isActive = pathname === `/items/${itemType.name}`;

              return (
                <Link
                  key={itemType.id}
                  href={`/items/${itemType.name}`}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center rounded-2xl border px-3 py-2.5 transition-colors",
                    isExpanded ? "gap-3" : "justify-center",
                    isActive
                      ? "border-sidebar-ring/60 bg-sidebar-accent text-sidebar-accent-foreground"
                      : "border-transparent text-sidebar-foreground/80 hover:border-sidebar-border hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                  aria-label={itemType.label}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                      getColorClasses(itemType.color),
                    )}
                  >
                    <Icon className="size-4" />
                  </span>

                  {isExpanded ? (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {itemType.label}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {itemCountByType[itemType.id] ?? 0}
                      </span>
                    </>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {isExpanded ? (
          <>
            <div className="space-y-2">
              <SidebarSectionLabel isExpanded={isExpanded}>
                Favorite collections
              </SidebarSectionLabel>
              <div className="space-y-1">
                {favoriteCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        getColorClasses(collection.color),
                      )}
                    >
                      <FolderOpen className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sidebar-foreground">
                        {collection.name}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/60">
                        {collection.itemCount} items
                      </p>
                    </div>
                    <Star className="size-4 fill-current text-yellow-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <SidebarSectionLabel isExpanded={isExpanded}>
                Recent collections
              </SidebarSectionLabel>
              <div className="space-y-1">
                {recentCollections.map((collection) => (
                  <div
                    key={collection.id}
                    className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        getColorClasses(collection.color),
                      )}
                    >
                      <FolderOpen className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sidebar-foreground">
                        {collection.name}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/60">
                        {collection.lastUpdatedAt ?? "No recent activity"}
                      </p>
                    </div>
                    <span className="text-xs text-sidebar-foreground/60">
                      {collection.itemCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="border-t border-sidebar-border/70 p-3">
        <div
          className={cn(
            "flex rounded-2xl border border-sidebar-border/80 bg-sidebar-accent/50 p-3",
            isExpanded ? "items-center gap-3" : "justify-center",
          )}
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {user.avatarLabel}
          </div>

          {isExpanded ? (
            <div className="min-w-0">
              <p className="truncate font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-sm text-sidebar-foreground/65">{user.email}</p>
              <p className="mt-1 text-xs font-medium text-sidebar-foreground/50">
                {formatPlanLabel(user.plan)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ data }: DashboardShellProps) {
  const pathname = usePathname();
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const collectionSummaries = useMemo<CollectionSummary[]>(() => {
    return data.collections.map((collection) => {
      const collectionItems = data.items.filter(
        (item) => item.collectionId === collection.id,
      );
      const lastUpdatedAt =
        [...collectionItems]
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
          .at(0)?.updatedAt ?? null;

      return {
        ...collection,
        itemCount: collectionItems.length,
        lastUpdatedAt,
      };
    });
  }, [data.collections, data.items]);

  const favoriteCollections = useMemo(
    () => collectionSummaries.filter((collection) => collection.isFavorite),
    [collectionSummaries],
  );

  const itemCountByType = useMemo(
    () =>
      data.items.reduce<Record<string, number>>((counts, item) => {
        counts[item.typeId] = (counts[item.typeId] ?? 0) + 1;
        return counts;
      }, {}),
    [data.items],
  );

  const recentCollections = useMemo(
    () =>
      [...collectionSummaries]
        .sort((left, right) =>
          (right.lastUpdatedAt ?? "").localeCompare(left.lastUpdatedAt ?? ""),
        )
        .slice(0, 4),
    [collectionSummaries],
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[auto_minmax(0,1fr)]">
        <aside
          className={cn(
            "hidden border-r border-sidebar-border/70 transition-[width] duration-200 lg:block",
            isDesktopSidebarExpanded ? "w-80" : "w-24",
          )}
        >
          <DashboardSidebar
            itemTypes={data.itemTypes}
            itemCountByType={itemCountByType}
            favoriteCollections={favoriteCollections}
            recentCollections={recentCollections}
            user={data.user}
            pathname={pathname}
            isExpanded={isDesktopSidebarExpanded}
          />
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border/60 bg-background/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <Button
                variant="outline"
                size="icon-lg"
                className="h-11 w-11 rounded-2xl lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
                aria-label="Open sidebar drawer"
              >
                <Menu className="size-5" />
              </Button>

              <Button
                variant="outline"
                size="icon-lg"
                className="hidden h-11 w-11 rounded-2xl lg:inline-flex"
                onClick={() =>
                  setIsDesktopSidebarExpanded((isExpanded) => !isExpanded)
                }
                aria-label="Toggle sidebar"
              >
                <Menu className="size-5" />
              </Button>

              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search items"
                  placeholder="Search items..."
                  className="h-11 rounded-2xl border-border/70 bg-card pl-10 pr-16 shadow-none"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/70 px-2 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                  Ctrl K
                </span>
              </div>

              <Button size="lg" className="h-11 rounded-2xl px-4">
                <Plus className="size-4" />
                New Item
              </Button>
            </div>
          </header>

          <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back, {data.user.name}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Dashboard
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
                Your developer knowledge hub with {data.collections.length} collections,{" "}
                {data.items.length} items, and {data.itemTypes.length} built-in item
                types.
              </p>
            </div>

            <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Main</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                    Phase 2 completes the dashboard navigation shell with a
                    collapsible sidebar, mobile drawer, item type routes, and
                    collection shortcuts. The larger content area stays intentionally
                    focused until phase 3 adds the collections grid, stats, and
                    recent items.
                  </p>
                </div>

                <div className="grid gap-3 sm:min-w-72">
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Favorite collections
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {favoriteCollections.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="text-sm font-medium text-muted-foreground">
                      Recent collections shown
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {recentCollections.length}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>

      {isMobileSidebarOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close sidebar drawer"
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] border-r border-sidebar-border/70 shadow-2xl">
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <X className="size-4" />
              </Button>
            </div>

            <DashboardSidebar
              itemTypes={data.itemTypes}
              itemCountByType={itemCountByType}
              favoriteCollections={favoriteCollections}
              recentCollections={recentCollections}
              user={data.user}
              pathname={pathname}
              isExpanded
              onNavigate={() => setIsMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
