"use client";

import { useState } from "react";
import { Check, Code2, Copy, File, FileImage, FileText, Link2, Pin, Sparkles, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardItem, DashboardItemType } from "@/types/items";

const itemTypeIconMap: Record<DashboardItemType["icon"], LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "file-text": FileText,
  file: File,
  image: FileImage,
  link: Link2,
};

type ItemCardType = {
  label: string;
  iconName: DashboardItemType["icon"];
  colorClasses: string;
  borderColorClass: string;
};

type ItemCardProps = {
  item: DashboardItem;
  itemType: ItemCardType;
  onClick?: (itemId: string) => void;
};

export function ItemCard({ item, itemType, onClick }: ItemCardProps) {
  const TypeIcon = itemTypeIconMap[itemType.iconName] ?? FileText;
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const text = item.content ?? item.description ?? item.title;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs text-muted-foreground">
            {item.updatedAt}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg p-1 hover:bg-muted transition-colors"
            aria-label="Copy title"
          >
            {copied ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
