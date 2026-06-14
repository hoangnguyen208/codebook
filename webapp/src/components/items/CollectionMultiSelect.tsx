"use client";

import { cn } from "@/lib/utils";
import type { CollectionForSelect } from "@/types/items";

type Props = {
  collections: CollectionForSelect[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function CollectionMultiSelect({ collections, selectedIds, onChange }: Props) {
  if (collections.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No collections yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {collections.map((col) => {
        const selected = selectedIds.includes(col.id);
        return (
          <button
            key={col.id}
            type="button"
            onClick={() =>
              onChange(
                selected
                  ? selectedIds.filter((id) => id !== col.id)
                  : [...selectedIds, col.id],
              )
            }
            className={cn(
              "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-foreground/30 bg-foreground/10 text-foreground"
                : "border-border/70 text-muted-foreground hover:bg-muted",
            )}
          >
            {col.name}
          </button>
        );
      })}
    </div>
  );
}
