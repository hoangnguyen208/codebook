"use client";

import { Check, Copy, Pencil, Pin, Star, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isEditing: boolean;
  saving: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  favoriteLoading: boolean;
  pinLoading: boolean;
  canCopy: boolean;
  onFavorite: () => Promise<void>;
  onPin: () => Promise<void>;
  onCopy: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  saveDisabled?: boolean;
  showDeleteConfirm?: boolean;
  setShowDeleteConfirm?: (show: boolean) => void;
};

export function DrawerActionBar({
  isEditing,
  saving,
  isFavorite,
  isPinned,
  favoriteLoading,
  pinLoading,
  canCopy,
  onFavorite,
  onPin,
  onCopy,
  onEdit,
  onDelete,
  onCancel,
  onSave,
  saveDisabled,
}: Props) {
  if (isEditing) {
    return (
      <div className="border-t border-border/70 p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Cancel"
        >
          <X className="size-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || saveDisabled}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          aria-label="Save"
        >
          <Check className="size-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border/70 p-4 flex items-center justify-between">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onFavorite}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          disabled={favoriteLoading}
        >
          <Star
            className={cn(
              "size-5",
              isFavorite
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground",
            )}
          />
        </button>
        <button
          type="button"
          onClick={onPin}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label={isPinned ? "Unpin" : "Pin"}
          disabled={pinLoading}
        >
          <Pin
            className={cn(
              "size-5",
              isPinned
                ? "fill-sky-400 text-sky-400"
                : "text-muted-foreground",
            )}
          />
        </button>
        {canCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Copy content"
          >
            <Copy className="size-5 text-muted-foreground" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
          aria-label="Edit"
        >
          <Pencil className="size-5 text-muted-foreground" />
        </button>
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg p-2 hover:bg-red-500/10 transition-colors"
        aria-label="Delete"
      >
        <Trash2 className="size-5 text-muted-foreground hover:text-red-400" />
      </button>
    </div>
  );
}
