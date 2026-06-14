"use client";

import { Ellipsis, Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEdit: () => void;
  onFavorite: () => void;
  isFavorite: boolean;
  favoriteLoading: boolean;
  showDeleteConfirm: boolean;
  onShowDeleteConfirm: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  deleting: boolean;
};

export function CollectionMenuDropdown({
  open,
  onToggle,
  onClose,
  onEdit,
  onFavorite,
  isFavorite,
  favoriteLoading,
  showDeleteConfirm,
  onShowDeleteConfirm,
  onCancelDelete,
  onDelete,
  deleting,
}: Props) {
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }}
        className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
        aria-label="Collection actions"
      >
        <Ellipsis className="size-4 text-muted-foreground" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-20" onClick={onClose} />
          <div className="absolute right-0 top-full mt-1 z-30 min-w-36 rounded-xl border border-border/70 bg-popover p-1 shadow-lg">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEdit();
              }}
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
                onFavorite();
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
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete();
                    }}
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
                      onCancelDelete();
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
                  onShowDeleteConfirm();
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
    </>
  );
}
