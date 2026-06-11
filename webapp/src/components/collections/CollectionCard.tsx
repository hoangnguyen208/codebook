"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Ellipsis, FolderOpen, Pencil, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { deleteCollection, toggleFavoriteCollection } from "@/actions/collections";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";
import type { DashboardRecentCollection } from "@/lib/db/collections";

const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

type CollectionCardProps = {
  collection: DashboardRecentCollection;
};

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);

  const dominantColor = collection.dominantColor || "slate";
  const colorClass = colorClasses[dominantColor] ?? colorClasses.slate;

  const closeMenu = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen(false);
    setEditOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Collection deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
    closeMenu();
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMenuOpen((prev) => !prev);
  };

  const handleFavorite = async () => {
    setFavoriteLoading(true);
    const result = await toggleFavoriteCollection(collection.id);
    if (result.success === true) {
      setIsFavorite(result.data);
    }
    setFavoriteLoading(false);
    closeMenu();
  };

  return (
    <>
      <div className="relative group rounded-3xl border border-border/70 bg-card p-6 shadow-sm hover:border-border transition-colors">
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={handleMenuToggle}
            className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
            aria-label="Collection actions"
          >
            <Ellipsis className="size-4 text-muted-foreground" />
          </button>
          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-20" onClick={closeMenu} />
              <div className="absolute right-0 top-full mt-1 z-30 min-w-36 rounded-xl border border-border/70 bg-popover p-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Pencil className="size-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleFavorite();
                  }}
                  disabled={favoriteLoading}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Star className={cn("size-4", isFavorite ? "fill-yellow-400 text-yellow-400" : "")} />
                  {isFavorite ? "Unfavorite" : "Favorite"}
                </button>
                {showDeleteConfirm ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Remove this collection? Items will not be deleted.
                    </p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setShowDeleteConfirm(false);
                        }}
                        className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setShowDeleteConfirm(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-accent transition-colors"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          ) : null}
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
