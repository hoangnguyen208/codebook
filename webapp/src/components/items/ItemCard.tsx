import type { LucideIcon } from "lucide-react";
import { Pin } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardItem } from "@/lib/db/items";

type ItemCardType = {
  label: string;
  icon: LucideIcon;
  colorClasses: string;
  borderColorClass: string;
};

type ItemCardProps = {
  item: DashboardItem;
  itemType: ItemCardType;
  onClick?: (itemId: string) => void;
};

export function ItemCard({ item, itemType, onClick }: ItemCardProps) {
  const TypeIcon = itemType.icon;

  return (
    <article
      onClick={onClick ? () => onClick(item.id) : undefined}
      className={cn(
        "rounded-3xl border bg-background/70 p-5",
        "border-l-4",
        itemType.borderColorClass,
        "border-r-border/70 border-t-border/70 border-b-border/70",
        onClick && "cursor-pointer hover:bg-background/90 transition-colors",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border",
            itemType.colorClasses,
          )}
        >
          <TypeIcon className="size-5" />
        </div>
        {item.isPinned ? (
          <Pin className="size-4 text-muted-foreground" />
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-muted-foreground">
          {itemType.label}
        </p>
        <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
        {item.description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground line-clamp-3">
            {item.description}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {item.updatedAt}
        </span>
      </div>
    </article>
  );
}
