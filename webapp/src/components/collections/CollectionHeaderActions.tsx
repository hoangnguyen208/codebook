"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { deleteCollection, toggleFavoriteCollection } from "@/actions/collections";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";

type Props = {
  collection: { id: string; name: string; description: string; isFavorite: boolean };
};

export function CollectionHeaderActions({ collection }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync when router.refresh updates props */
    setIsFavorite(collection.isFavorite);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [collection.isFavorite]);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);
    if (result.success) {
      toast.success("Collection deleted");
      router.push("/collections");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="rounded-lg p-2 hover:bg-muted transition-colors"
        aria-label="Edit collection"
      >
        <Pencil className="size-5 text-muted-foreground" />
      </button>
      <button
        type="button"
        onClick={async () => {
          setFavoriteLoading(true);
          const result = await toggleFavoriteCollection(collection.id);
          if (result.success === true) {
            setIsFavorite(result.data);
            router.refresh();
          }
          setFavoriteLoading(false);
        }}
        disabled={favoriteLoading}
        className="rounded-lg p-2 hover:bg-muted transition-colors"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          className={cn(
            "size-5",
            isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
          )}
        />
      </button>
      {showDeleteConfirm ? (
        <div className="flex items-center gap-1">
          <p className="mr-1 text-xs text-muted-foreground">Delete?</p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {deleting ? "..." : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
          >
            No
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="rounded-lg p-2 hover:bg-red-500/10 transition-colors"
          aria-label="Delete collection"
        >
          <Trash2 className="size-5 text-muted-foreground hover:text-red-400" />
        </button>
      )}

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={collection}
      />
    </div>
  );
}
