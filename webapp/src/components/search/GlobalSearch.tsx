"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Code2, File, FileImage, FileText, FolderOpen, Link2, Search, Sparkles, Terminal, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useSearchData } from "@/components/search/SearchProvider";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { cn } from "@/lib/utils";

const itemTypeIcons: Record<string, LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "file-text": FileText,
  file: File,
  image: FileImage,
  link: Link2,
};

const colorClasses: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/30",
  orange: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  yellow: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  slate: "bg-slate-500/10 text-slate-300 border-slate-500/30",
  pink: "bg-pink-500/10 text-pink-300 border-pink-500/30",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

function getColorClasses(color: string) {
  return colorClasses[color] ?? "bg-muted text-muted-foreground border-border";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GlobalSearch({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { openDrawer } = useItemDrawer();
  const { items, collections } = useSearchData();
  const [query, setQuery] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={handleOpenChange}
      label="Global search"
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto max-w-xl rounded-2xl border border-border/70 bg-popover shadow-2xl overflow-hidden">
        <div className="flex items-center border-b border-border/70 px-4">
          <Search className="mr-3 size-4 shrink-0 text-muted-foreground" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search items and collections..."
            className="flex-1 h-14 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="ml-2 shrink-0 rounded-lg p-1.5 hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-12 text-center text-sm text-muted-foreground">
            No results found.
          </Command.Empty>

          {items.length > 0 ? (
            <Command.Group heading="Items" className="mb-2">
              {items.map((item) => (
                <Command.Item
                  key={`item-${item.id}`}
                  value={`item ${item.id} ${item.title} ${item.description}`}
                  onSelect={() => {
                    openDrawer(item.id);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-accent cursor-pointer"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      "bg-muted text-muted-foreground border-border",
                    )}
                  >
                    {(() => {
                      const iconName = item.fileName ? "file" : item.url ? "link" : "code";
                      const Icon = itemTypeIcons[iconName] ?? FileText;
                      return <Icon className="size-4" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    Item
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}

          {collections.length > 0 ? (
            <Command.Group heading="Collections" className="mb-2">
              {collections.map((col) => (
                <Command.Item
                  key={`col-${col.id}`}
                  value={`collection ${col.id} ${col.name} ${col.description}`}
                  onSelect={() => {
                    router.push(`/collections/${encodeURIComponent(col.id)}`);
                    onOpenChange(false);
                  }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm aria-selected:bg-accent cursor-pointer"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      getColorClasses(col.dominantColor),
                    )}
                  >
                    <FolderOpen className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{col.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {col.description ?? `${col.itemCount} items`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {col.itemCount} items
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          ) : null}
        </Command.List>

        <div className="flex items-center gap-2 border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground">
          <kbd className="rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>
          <span>Navigate</span>
          <kbd className="ml-2 rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd>
          <span>Select</span>
          <kbd className="ml-2 rounded-md border border-border/70 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd>
          <span>Close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
