"use client";

import Link from "next/link";
import {
  Code2,
  File,
  FileImage,
  FileText,
  FolderKanban,
  Link2,
  Sparkles,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ItemDrawerProvider, useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import type { DashboardItem } from "@/types/items";
import type { DashboardRecentCollection } from "@/lib/db/collections";

const itemTypeIcons: Record<string, LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "file-text": FileText,
  file: File,
  image: FileImage,
  link: Link2,
};

type FavoritesListProps = {
  items: DashboardItem[];
  collections: DashboardRecentCollection[];
  itemTypeMap: Record<string, { icon: string | null; name: string; color: string | null }>;
};

const colorClasses: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  slate: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  pink: "bg-pink-500/10 text-pink-300 border-pink-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

function normaliseIcon(name: string | null): string {
  const lowered = name?.trim().toLowerCase() ?? "";
  switch (lowered) {
    case "code":
    case "code2":
      return "code";
    case "sparkles":
      return "sparkles";
    case "terminal":
      return "terminal";
    case "stickynote":
    case "filetext":
    case "file-text":
      return "file-text";
    case "file":
      return "file";
    case "image":
    case "fileimage":
      return "image";
    case "link":
    case "link2":
      return "link";
    default:
      return "file-text";
  }
}

function FavoritesListInner({ items, collections, itemTypeMap }: FavoritesListProps) {
  const { openDrawer } = useItemDrawer();

  const getItemTypeLabel = (typeId: string) => {
    const t = itemTypeMap[typeId];
    if (!t) return "Item";
    return t.name.charAt(0).toUpperCase() + t.name.slice(1);
  };

  const getItemTypeIcon = (typeId: string) => {
    const t = itemTypeMap[typeId];
    const iconKey = normaliseIcon(t?.icon ?? null);
    return itemTypeIcons[iconKey] ?? FileText;
  };

  const getItemTypeColor = (typeId: string) => {
    const t = itemTypeMap[typeId];
    const colorKey = t?.color ?? "slate";
    return colorClasses[colorKey] ?? colorClasses.slate;
  };

  return (
    <div className="flex flex-col gap-8">
      {collections.length > 0 && (
        <div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Collections ({collections.length})
          </h2>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {collections.map((collection) => (
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

      {items.length > 0 && (
        <div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Items ({items.length})
          </h2>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            {items.map((item) => {
              const Icon = getItemTypeIcon(item.typeId);
              const typeLabel = getItemTypeLabel(item.typeId);
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
