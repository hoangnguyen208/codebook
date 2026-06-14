"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { FolderKanban, Layers3, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";
import { SearchProvider } from "@/components/search/SearchProvider";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Button } from "@/components/ui/button";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMainContent } from "@/components/dashboard/DashboardMainContent";
import type { DashboardStat } from "@/components/dashboard/DashboardStats";
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

export function DashboardShell({
  data,
  recentCollectionsOverride,
  fetchError,
  searchData,
}: DashboardShellProps) {
  const pathname = usePathname();
  const isPro = data.user.plan === "pro";
  const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createCollectionDialogOpen, setCreateCollectionDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinningItemId, setPinningItemId] = useState<string | null>(null);

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

  const hasFavoriteContent =
    data.items.some((i) => i.isFavorite) ||
    data.collections.some((c) => c.isFavorite);

  return (
    <main className="min-h-screen bg-background">
      <SearchProvider items={searchData?.items ?? []} collections={searchData?.collections ?? []}>
      <ItemDrawerProvider
        selectedItemId={drawerItemId}
        onOpenChange={setDrawerItemId}
        isPro={isPro}
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
          <DashboardHeader
            isDesktopSidebarExpanded={isDesktopSidebarExpanded}
            onToggleSidebar={() =>
              setIsDesktopSidebarExpanded((isExpanded) => !isExpanded)
            }
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onSearchOpen={() => setSearchOpen(true)}
            pathname={pathname}
            hasFavoriteContent={hasFavoriteContent}
            isPro={isPro}
            user={data.user}
            onCreateCollection={() => setCreateCollectionDialogOpen(true)}
            onCreateItem={() => setCreateDialogOpen(true)}
          />

          <DashboardMainContent
            userName={data.user.name}
            collectionCount={data.collections.length}
            itemCount={data.items.length}
            itemTypeCount={data.itemTypes.length}
            fetchError={fetchError ?? null}
            stats={stats}
            mainRecentCollections={mainRecentCollections}
            pinnedItems={pinnedItems}
            recentItems={recentItems}
            itemTypeById={itemTypeById}
            setDrawerItemId={setDrawerItemId}
            setPinningItemId={setPinningItemId}
            pinningItemId={pinningItemId}
          />
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

      <CreateItemDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} isPro={isPro} />
      <CreateCollectionDialog open={createCollectionDialogOpen} onOpenChange={setCreateCollectionDialogOpen} />
      </SearchProvider>
    </main>
  );
}
