"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { CollectionMenuDropdown } from "@/components/collections/CollectionMenuDropdown";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { colorClasses } from "@/lib/color-utils";
import type { DashboardRecentCollection } from "@/lib/db/collections";

type CollectionCardProps = {
  collection: DashboardRecentCollection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const {
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleting,
    favoriteLoading,
    isFavorite,
    handleDelete,
    handleFavorite,
  } = useCollectionActions(collection.id, collection.isFavorite);

  const dominantColor = collection.dominantColor || "slate";
  const colorClass = colorClasses[dominantColor] ?? colorClasses.slate;

  return (
    <>
      <div className="relative group rounded-3xl border border-border/70 bg-card p-6 shadow-sm hover:border-border transition-colors">
        <div className="absolute top-4 right-4 z-10">
          <CollectionMenuDropdown
            open={menuOpen}
            onToggle={() => setMenuOpen((prev) => !prev)}
            onClose={() => { setMenuOpen(false); setShowDeleteConfirm(false); }}
            onEdit={() => { setMenuOpen(false); setEditOpen(true); }}
            onFavorite={() => { handleFavorite(); setMenuOpen(false); setShowDeleteConfirm(false); }}
            isFavorite={isFavorite}
            favoriteLoading={favoriteLoading}
            showDeleteConfirm={showDeleteConfirm}
            onShowDeleteConfirm={() => setShowDeleteConfirm(true)}
            onCancelDelete={() => setShowDeleteConfirm(false)}
            onDelete={handleDelete}
            deleting={deleting}
          />
        </div>

        <Link
          href={`/collections/${encodeURIComponent(collection.id)}`}
          className="block"
        >
          <div className="flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex size-11 items-center justify-center rounded-2xl border",
                colorClass,
              )}
            >
              <FolderOpen className="size-5" />
            </div>
            <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground group-hover:opacity-100 transition-opacity items-center gap-1 inline-flex">
              Open
              <ArrowUpRight className="size-3" />
            </span>
          </div>

          <h3 className="mt-4 text-lg font-semibold">{collection.name}</h3>
          {collection.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-2">
              {collection.description}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
            </span>
            {collection.typeIcons.length > 0 ? (
              <span className="text-xs text-muted-foreground">·</span>
            ) : null}
            <span className="text-xs text-muted-foreground">
              {collection.typeIcons.join(", ")}
            </span>
          </div>
        </Link>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={{ id: collection.id, name: collection.name, description: collection.description }}
      />
    </>
  );
}
