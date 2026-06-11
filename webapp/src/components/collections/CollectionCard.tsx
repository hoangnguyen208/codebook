import Link from "next/link";
import { ArrowUpRight, FolderOpen } from "lucide-react";

import { cn } from "@/lib/utils";
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
  const dominantColor = collection.dominantColor || "slate";
  const colorClass = colorClasses[dominantColor] ?? colorClasses.slate;

  return (
    <Link
      href={`/collections/${encodeURIComponent(collection.id)}`}
      className="group rounded-3xl border border-border/70 bg-card p-6 shadow-sm hover:border-border hover:bg-accent/30 transition-colors"
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
        <span className="shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 inline-flex">
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
  );
}
