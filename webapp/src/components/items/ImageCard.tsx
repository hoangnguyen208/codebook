import { FileImage } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { DashboardItem } from "@/types/items";

type ImageCardProps = {
  item: DashboardItem;
  onClick?: (itemId: string) => void;
};

export function ImageCard({ item, onClick }: ImageCardProps) {
  const hasImage = item.fileUrl != null && item.fileUrl.length > 0;

  return (
    <article
      onClick={onClick ? () => onClick(item.id) : undefined}
      className={cn(
        "group rounded-3xl border border-border/70 bg-background/70 overflow-hidden",
        onClick && "cursor-pointer",
      )}
    >
      <div className="aspect-video bg-muted relative overflow-hidden">
        {hasImage ? (
          <Image
            src={item.fileUrl!}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <FileImage className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold truncate">{item.title}</h3>
        {item.description ? (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        ) : null}
        {item.tags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
