"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

type Props = {
  deleting: boolean;
  onDelete: () => Promise<void>;
  onCancel: () => void;
};

export function DeleteItemConfirm({ deleting, onDelete, onCancel }: Props) {
  return (
    <div className="border-t border-border/70 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-red-400">
        <AlertTriangle className="size-4" />
        <span className="font-medium">Delete this item?</span>
      </div>
      <p className="text-xs text-muted-foreground">
        This action cannot be undone. The item and all its tags will be permanently removed.
      </p>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
