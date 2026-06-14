"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Clock3, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import { colorClasses } from "@/lib/color-utils";
import { useCollectionActions } from "@/hooks/use-collection-actions";
import { CollectionMenuDropdown } from "@/components/collections/CollectionMenuDropdown";

const borderClasses: Record<string, string> = {
  blue: "border-t-2 border-t-blue-500/40 border border-border/70 border-t-blue-500/40",
  purple: "border-t-2 border-t-purple-500/40 border border-border/70 border-t-purple-500/40",
  orange: "border-t-2 border-t-orange-500/40 border border-border/70 border-t-orange-500/40",
  yellow: "border-t-2 border-t-yellow-500/40 border border-border/70 border-t-yellow-500/40",
  slate: "border-t-2 border-t-slate-500/40 border border-border/70 border-t-slate-500/40",
  pink: "border-t-2 border-t-pink-500/40 border border-border/70 border-t-pink-500/40",
  emerald: "border-t-2 border-t-emerald-500/40 border border-border/70 border-t-emerald-500/40",
};

type Props = {
  collection: {
    id: string;
    name: string;
    description: string;
    itemCount: number;
    lastUpdatedAt: string | null;
    dominantColor?: string;
    typeIcons?: string[];
    isFavorite?: boolean;
  };
  lastUpdatedLabel: string;
  typeIconComponents: React.ReactNode;
};

export function DashboardCollectionCard({ collection, lastUpdatedLabel, typeIconComponents }: Props) {
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
  } = useCollectionActions(collection.id, collection.isFavorite ?? false);

  const dominant = collection.dominantColor || "slate";
  const colorClass = colorClasses[dominant] ?? colorClasses.slate;
  const borderClass = borderClasses[dominant] ?? borderClasses.slate;

  return (
    <>
      <div className={cn("group relative rounded-3xl bg-background/70 p-5 hover:bg-background/90 transition-colors", borderClass)}>
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

        <Link href={`/collections/${encodeURIComponent(collection.id)}`} className="block">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("flex size-11 items-center justify-center rounded-2xl border", colorClass)}>
              <FolderOpen className="size-5" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock3 className="size-3.5" />
              {lastUpdatedLabel}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold">{collection.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{collection.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{collection.itemCount} items</span>
              {typeIconComponents}
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">Open collection<ArrowUpRight className="size-4" /></span>
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
