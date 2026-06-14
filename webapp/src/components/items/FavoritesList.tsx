"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  FolderKanban,
} from "lucide-react";

import { colorClasses } from "@/lib/color-utils";
import { itemTypeIcons, resolveItemIcon } from "@/lib/icons";

import { ItemDrawerProvider, useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import { cn } from "@/lib/utils";
import type { DashboardItem } from "@/types/items";
import type { DashboardRecentCollection } from "@/lib/db/collections";

type FavoritesListProps = {
  items: DashboardItem[];
  collections: DashboardRecentCollection[];
  itemTypeMap: Record<string, { icon: string | null; name: string; color: string | null }>;
};

type CollectionSortField = "name" | "date";
type ItemSortField = "name" | "date" | "type";

function getItemTypeLabel(typeId: string, itemTypeMap: FavoritesListProps["itemTypeMap"]): string {
  const t = itemTypeMap[typeId];
  if (!t) return "Item";
  return t.name.charAt(0).toUpperCase() + t.name.slice(1);
}

type SortState = { field: CollectionSortField; ascending: boolean };

type SortButtonProps<T extends string> = {
  label: string;
  field: T;
  active: boolean;
  ascending: boolean;
  onClick: (field: T) => void;
};

function SortButton<T extends string>({ label, field, active, ascending, onClick }: SortButtonProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-foreground/30 bg-foreground/5 text-foreground"
          : "border-border/70 text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {label}
      {active ? (
        ascending ? (
          <ChevronUp className="size-3" />
        ) : (
          <ChevronDown className="size-3" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" />
      )}
    </button>
  );
}

function FavoritesListInner({ items, collections, itemTypeMap }: FavoritesListProps) {
  const { openDrawer } = useItemDrawer();
  const [collectionSort, setCollectionSort] = useState<SortState>({ field: "date", ascending: false });
  const [itemSort, setItemSort] = useState<{ field: ItemSortField; ascending: boolean }>({ field: "date", ascending: false });

  const handleCollectionSort = (field: CollectionSortField) => {
    setCollectionSort((prev) => ({
      field,
      ascending: prev.field === field ? !prev.ascending : field === "name",
    }));
  };

  const handleItemSort = (field: ItemSortField) => {
    setItemSort((prev) => ({
      field,
      ascending: prev.field === field ? !prev.ascending : field === "name",
    }));
  };

  const getItemTypeIcon = (typeId: string) => {
    const t = itemTypeMap[typeId];
    return resolveItemIcon(t?.icon ?? null);
  };

  const getItemTypeColor = (typeId: string) => {
    const t = itemTypeMap[typeId];
    const colorKey = t?.color ?? "slate";
    return colorClasses[colorKey] ?? colorClasses.slate;
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    const factor = itemSort.ascending ? 1 : -1;

    sorted.sort((a, b) => {
      switch (itemSort.field) {
        case "name":
          return factor * a.title.localeCompare(b.title);
        case "type":
          return factor * getItemTypeLabel(a.typeId, itemTypeMap).localeCompare(getItemTypeLabel(b.typeId, itemTypeMap));
        case "date":
        default:
          return factor * (a.updatedAt.localeCompare(b.updatedAt));
      }
    });

    return sorted;
  }, [items, itemSort, itemTypeMap]);

  const sortedCollections = useMemo(() => {
    const sorted = [...collections];
    const factor = collectionSort.ascending ? 1 : -1;

    sorted.sort((a, b) => {
      switch (collectionSort.field) {
        case "name":
          return factor * a.name.localeCompare(b.name);
        case "date":
        default:
          return factor * ((a.lastUpdatedAt ?? "").localeCompare(b.lastUpdatedAt ?? ""));
      }
    });

    return sorted;
  }, [collections, collectionSort]);

  return (
    <div className="flex flex-col gap-8">
      {sortedCollections.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Collections ({sortedCollections.length})
            </h2>
            <div className="flex items-center gap-1.5">
              <SortButton
                label="Name"
                field="name"
                active={collectionSort.field === "name"}
                ascending={collectionSort.ascending}
                onClick={handleCollectionSort}
              />
              <SortButton
                label="Date"
                field="date"
                active={collectionSort.field === "date"}
                ascending={collectionSort.ascending}
                onClick={handleCollectionSort}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {sortedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="flex items-center gap-3 px-3 py-2 font-mono text-sm border-b border-border/30 last:border-b-0 hover:bg-accent/50 transition-colors"
              >
                <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate">{collection.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {collection.lastUpdatedAt ?? ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {sortedItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Items ({sortedItems.length})
            </h2>
            <div className="flex items-center gap-1.5">
              <SortButton
                label="Name"
                field="name"
                active={itemSort.field === "name"}
                ascending={itemSort.ascending}
                onClick={handleItemSort}
              />
              <SortButton
                label="Date"
                field="date"
                active={itemSort.field === "date"}
                ascending={itemSort.ascending}
                onClick={handleItemSort}
              />
              <SortButton
                label="Type"
                field="type"
                active={itemSort.field === "type"}
                ascending={itemSort.ascending}
                onClick={handleItemSort}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {sortedItems.map((item) => {
              const Icon = getItemTypeIcon(item.typeId);
              const typeLabel = getItemTypeLabel(item.typeId, itemTypeMap);
              const colorClass = getItemTypeColor(item.typeId);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openDrawer(item.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 font-mono text-sm border-b border-border/30 last:border-b-0 hover:bg-accent/50 transition-colors text-left"
                >
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className={["shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-mono leading-none", colorClass].join(" ")}>
                    {typeLabel}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.updatedAt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FavoritesList({ items, collections, itemTypeMap }: FavoritesListProps) {
  return (
    <ItemDrawerProvider>
      <FavoritesListInner items={items} collections={collections} itemTypeMap={itemTypeMap} />
      <ItemDrawerSheet />
    </ItemDrawerProvider>
  );
}
