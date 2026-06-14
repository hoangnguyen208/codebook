"use client";

import Link from "next/link";
import { ArrowUpRight, FolderOpen, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { itemTypeIcons } from "@/lib/icons";
import { getColorClasses, getDotColorClass } from "@/lib/color-utils";
import type { DashboardItemType } from "@/types/items";

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

export function DashboardSidebar({
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
                {favoriteCollections.map((collection) => {
                  const favIsActive = pathname === `/collections/${encodeURIComponent(collection.id)}`;
                  return (
                  <Link
                    key={collection.id}
                    href={`/collections/${encodeURIComponent(collection.id)}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                      favIsActive
                        ? "border-sidebar-ring/60 bg-sidebar-accent text-sidebar-accent-foreground"
                        : "border-transparent",
                    )}
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
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <SidebarSectionLabel isExpanded={isExpanded}>
                Recent collections
              </SidebarSectionLabel>
              <div className="space-y-1">
                {recentCollections.map((collection) => {
                  const recIsActive = pathname === `/collections/${encodeURIComponent(collection.id)}`;
                  return (
                  <Link
                    key={collection.id}
                    href={`/collections/${encodeURIComponent(collection.id)}`}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                      recIsActive
                        ? "border-sidebar-ring/60 bg-sidebar-accent text-sidebar-accent-foreground"
                        : "border-transparent",
                    )}
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
                  );
                })}
              </div>
              <Link
                href="/collections"
                onClick={onNavigate}
                className={cn(
                  "inline-flex items-center gap-1 px-3 pt-1 text-sm font-medium text-sidebar-primary hover:text-sidebar-primary/80",
                  pathname === "/collections"
                    ? "text-sidebar-accent-foreground"
                    : "",
                )}
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
