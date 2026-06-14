"use client";

import { cn } from "@/lib/utils";
import { ITEM_TYPES } from "@/lib/item-type-config";

type Props = {
  selected: string;
  onChange: (typeName: string) => void;
};

export function TypeSelector({ selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {ITEM_TYPES.map((t) => (
        <button
          key={t.name}
          type="button"
          onClick={() => onChange(t.name)}
          className={cn(
            "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
            selected === t.name
              ? "border-foreground/30 bg-foreground/10 text-foreground"
              : "border-border/70 text-muted-foreground hover:bg-muted",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
