"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  ChevronUp,
  Code2,
  File,
  FileImage,
  FileText,
  FolderKanban,
  FolderOpen,
  Layers3,
  Link2,
  Menu,
  Pin,
  Plus,
  Search,
  Sparkles,
  Star,
  Terminal,
  X,
} from "lucide-react";

import { UserAvatar } from "@/components/auth/UserAvatar";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";
import { DashboardCollectionCard } from "@/components/collections/DashboardCollectionCard";
import { SearchProvider } from "@/components/search/SearchProvider";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { togglePinItem } from "@/actions/items";
import type { DashboardItem, DashboardItemType } from "@/types/items";

type DashboardUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  plan: "free" | "pro";
};

type DashboardCollection = {
  id: string;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
};

type DashboardShellProps = {
  data: {
    user: DashboardUser;
    itemTypes: DashboardItemType[];
    collections: DashboardCollection[];
    items: DashboardItem[];
  };
  recentCollectionsOverride?: DashboardRecentCollection[];
  fetchError?: string | null;
  searchData?: {
    items: DashboardItem[];
    collections: DashboardRecentCollection[];
  };
};

type CollectionSummary = DashboardCollection & {
  itemCount: number;
  lastUpdatedAt: string | null;
  dominantColor?: string;
  typeIcons?: string[];
};

type DashboardStat = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
};

type DashboardRecentCollection = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  lastUpdatedAt: string | null;
  dominantColor: string;
  isFavorite: boolean;
  typeIcons: string[];
};

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

function getColorClasses(color: string) {
  return colorClasses[color] ?? "border-border bg-muted text-muted-foreground";
}

function getItemTypeIcon(iconName: string) {
  return itemTypeIcons[iconName as keyof typeof itemTypeIcons] ?? FileText;
}

function getDotColorClass(color: string) {
  const dotClasses: Record<string, string> = {
    blue: "bg-blue-400",
    purple: "bg-purple-400",
    orange: "bg-orange-400",
    yellow: "bg-yellow-400",
    slate: "bg-slate-400",
    pink: "bg-pink-400",
    emerald: "bg-emerald-400",
  };

  return dotClasses[color] ?? "bg-muted-foreground";
}

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
  pathname,
  isExpanded,
  isPro,
  onNavigate,
}: {
  itemTypes: DashboardItemType[];
  itemCountByType: Record<string, number>;
  favoriteCollections: CollectionSummary[];
  recentCollections: CollectionSummary[];
  pathname: string;
  isExpanded: boolean;
  isPro: boolean;
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
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
          <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
            <text x="14" y="19" textAnchor="middle" className="fill-white font-mono text-[11px] font-bold select-none">
              &lt;/&gt;
            </text>
          </svg>
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
                        {(itemType.name === "file" || itemType.name === "image") && !isPro && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">
                            <Sparkles className="size-2.5" />
                            PRO
                          </span>
                        )}
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
                  <Link
                    key={collection.id}
                    href={`/collections/${encodeURIComponent(collection.id)}`}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        getColorClasses(collection.dominantColor ?? collection.color),
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
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <SidebarSectionLabel isExpanded={isExpanded}>
                Recent collections
              </SidebarSectionLabel>
              <div className="space-y-1">
                {recentCollections.map((collection) => (
                  <Link
                    key={collection.id}
                    href={`/collections/${encodeURIComponent(collection.id)}`}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                  >
                    <span
                      className={cn(
                        "size-2.5 shrink-0 rounded-full",
                        getDotColorClass(collection.dominantColor ?? collection.color),
                      )}
                    />
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
                  </Link>
                ))}
              </div>
              <Link
                href="/collections"
                onClick={onNavigate}
                className="inline-flex items-center gap-1 px-3 pt-1 text-sm font-medium text-sidebar-primary hover:text-sidebar-primary/80"
              >
                View all collections
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </>
        ) : null}
      </div>

    </div>
  );
}

export function DashboardShell({
  data,
  recentCollectionsOverride,
  fetchError,
  searchData,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPro = data.user.plan === "pro";
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createCollectionDialogOpen, setCreateCollectionDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinningItemId, setPinningItemId] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  const collectionSummaries = useMemo<CollectionSummary[]>(() => {
    return data.collections.map((collection) => {
      const collectionItems = data.items.filter(
        (item) => item.collectionIds.includes(collection.id),
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

  const mainRecentCollections = useMemo<CollectionSummary[]>(() => {
    if (!recentCollectionsOverride) {
      return [...collectionSummaries]
        .sort((left, right) =>
          (right.lastUpdatedAt ?? "").localeCompare(left.lastUpdatedAt ?? ""),
        )
        .slice(0, 6);
    }

    return recentCollectionsOverride.map((collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      color: collection.dominantColor,
      isFavorite: collection.isFavorite,
      itemCount: collection.itemCount,
      lastUpdatedAt: collection.lastUpdatedAt,
      dominantColor: collection.dominantColor,
      typeIcons: collection.typeIcons,
    }));
  }, [collectionSummaries, recentCollectionsOverride]);

  const recentItems = useMemo(
    () =>
      [...data.items]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 10),
    [data.items],
  );

  const pinnedItems = useMemo(
    () =>
      data.items
        .filter((item) => item.isPinned)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
    [data.items],
  );

  const favoriteItemCount = useMemo(
    () => data.items.filter((item) => item.isFavorite).length,
    [data.items],
  );

  const itemTypeById = useMemo(
    () =>
      Object.fromEntries(data.itemTypes.map((itemType) => [itemType.id, itemType])),
    [data.itemTypes],
  );

  const stats = useMemo<DashboardStat[]>(
    () => [
      {
        label: "Items",
        value: data.items.length,
        description: "Total resources in your workspace",
        icon: Layers3,
      },
      {
        label: "Collections",
        value: data.collections.length,
        description: "Mixed groups for organizing work",
        icon: FolderKanban,
      },
      {
        label: "Favorite items",
        value: favoriteItemCount,
        description: "Starred resources you revisit often",
        icon: Star,
        iconClassName: "fill-yellow-400 text-yellow-400",
      },
      {
        label: "Favorite collections",
        value: favoriteCollections.length,
        description: "Pinned collection shortcuts in the sidebar",
        icon: Star,
        iconClassName: "fill-yellow-400 text-yellow-400",
      },
    ],
    [data.collections.length, data.items.length, favoriteCollections.length, favoriteItemCount],
  );

  return (
    <main className="min-h-screen bg-background">
      <SearchProvider items={searchData?.items ?? []} collections={searchData?.collections ?? []}>
      <ItemDrawerProvider
        selectedItemId={drawerItemId}
        onOpenChange={setDrawerItemId}
      >
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
            pathname={pathname}
            isExpanded={isDesktopSidebarExpanded}
            isPro={isPro}
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
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground hidden sm:block" />
                <Input
                  aria-label="Search items"
                  placeholder="Search items..."
                  className="hidden sm:block h-11 rounded-2xl border-border/70 bg-card pl-10 pr-16 shadow-none cursor-pointer"
                  readOnly
                  onClick={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSearchOpen(true);
                    }
                  }}
                  tabIndex={0}
                />
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="h-11 w-11 rounded-2xl sm:hidden"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search items"
                >
                  <Search className="size-5" />
                </Button>
                <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/70 px-2 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
                  Ctrl K
                </span>
              </div>

              <Link
                href="/favorites"
                className="h-11 rounded-2xl border border-border/70 bg-card px-2 sm:px-3 inline-flex items-center gap-1.5 sm:gap-2 text-sm hover:bg-accent transition-colors shrink-0"
              >
                <Star className={cn(
                  "size-4",
                  data.items.some((i) => i.isFavorite) ||
                  data.collections.some((c) => c.isFavorite)
                    ? "fill-yellow-400 text-yellow-400"
                    : ""
                )} />
                <span className="hidden sm:inline">Favorites</span>
              </Link>

              <Button size="lg" className="h-11 rounded-2xl px-2 sm:px-4" onClick={() => setCreateCollectionDialogOpen(true)}>
                <FolderOpen className="size-4" />
                <span className="hidden sm:inline">New Collection</span>
              </Button>

              <Button size="lg" className="h-11 rounded-2xl px-2 sm:px-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="size-4" />
                <span className="hidden sm:inline">New Item</span>
              </Button>

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 text-sm hover:bg-accent"
                  onClick={() => setIsProfileMenuOpen((open) => !open)}
                  aria-label="Open profile menu"
                  aria-expanded={isProfileMenuOpen}
                >
                  <UserAvatar
                    nameOrEmail={data.user.name || data.user.email}
                    imageUrl={data.user.image}
                    className="size-7"
                    textClassName="text-xs"
                  />
                  <span className="hidden max-w-32 truncate sm:inline">{data.user.name}</span>
                  <ChevronUp
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      isProfileMenuOpen ? "rotate-180" : "",
                    )}
                  />
                </button>
                {isProfileMenuOpen ? (
                  <div className="absolute top-full right-0 z-10 mt-2 min-w-40 rounded-xl border border-border/70 bg-popover p-1 shadow-lg">
                    <Link
                      href="/settings"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link
                      href="/api/auth/signout-all"
                      className="block rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Sign out
                    </Link>
                  </div>
                ) : null}
              </div>
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

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article
                    key={stat.label}
                    className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.label}
                        </p>
                        <p className="mt-3 text-3xl font-semibold tracking-tight">
                          {stat.value}
                        </p>
                      </div>
                      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
                        <Icon className={cn("size-5", stat.iconClassName ?? "text-muted-foreground")} />
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {stat.description}
                    </p>
                  </article>
                );
              })}
            </section>

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
                              const Icon = getItemTypeIcon(iconName);
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
                      const ItemTypeIcon = itemType ? itemTypeIcons[itemType.icon] : FileText;

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
                    const ItemTypeIcon = itemType ? itemTypeIcons[itemType.icon] : FileText;

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
        </div>
      </div>
      <ItemDrawerSheet />
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
      </ItemDrawerProvider>

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
              pathname={pathname}
              isExpanded
              isPro={isPro}
              onNavigate={() => setIsMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <CreateItemDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <CreateCollectionDialog open={createCollectionDialogOpen} onOpenChange={setCreateCollectionDialogOpen} />
      </SearchProvider>
    </main>
  );
}
