"use client";

import { useEffect, useState } from "react";
import { Code2, Copy, File, FileImage, FileText, Link2, Pencil, Pin, Sparkles, Star, Terminal, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { cn } from "@/lib/utils";
import type { ItemDetail } from "@/types/items";

const itemTypeIcons: Record<string, LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  stickynote: FileText,
  filetext: FileText,
  "file-text": FileText,
  file: File,
  image: FileImage,
  fileimage: FileImage,
  link: Link2,
  link2: Link2,
};

const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const colorTokenMap: Record<string, string> = {
  "#3b82f6": "blue",
  "#8b5cf6": "purple",
  "#f97316": "orange",
  "#fde047": "yellow",
  "#6b7280": "slate",
  "#ec4899": "pink",
  "#10b981": "emerald",
};

function resolveIcon(iconName: string | null): LucideIcon {
  if (!iconName) return FileText;
  return itemTypeIcons[iconName.trim().toLowerCase()] ?? FileText;
}

function resolveColorClasses(typeName: string, typeColor: string | null): string {
  const byName: Record<string, string> = {
    snippet: "blue",
    prompt: "purple",
    command: "orange",
    note: "yellow",
    file: "slate",
    image: "pink",
    link: "emerald",
  };
  const token = byName[typeName.toLowerCase()]
    ?? (typeColor ? colorTokenMap[typeColor.toLowerCase()] : null)
    ?? "slate";
  return colorClasses[token] ?? "border-border bg-muted text-muted-foreground";
}

export function ItemDrawerSheet() {
  const { isOpen, selectedItemId, closeDrawer } = useItemDrawer();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (!selectedItemId || !isOpen) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional loading UX
    setLoading(true);
    fetch(`/api/items/${encodeURIComponent(selectedItemId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as ItemDetail;
      })
      .then((data) => {
        setItem(data);
        if (data) {
          setIsFavorite(data.isFavorite);
          setIsPinned(data.isPinned);
        }
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [selectedItemId, isOpen]);

  const handleCopy = () => {
    if (item) {
      const text = item.content ?? item.url ?? item.title;
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const typeColorClasses = item ? resolveColorClasses(item.typeName, item.typeColor) : "";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) closeDrawer(); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        {loading ? (
          <div className="flex flex-col gap-4 p-6">
            <div className="h-8 w-2/3 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            <div className="mt-4 space-y-3">
              <div className="h-20 rounded-xl bg-muted animate-pulse" />
              <div className="h-20 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        ) : item ? (
          <>
            <SheetHeader className="p-6 pb-0">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    typeColorClasses,
                  )}
                >
                  {item
                    ? (() => {
                        const Icon = resolveIcon(item.typeIcon);
                        return <Icon className="size-4" />;
                      })()
                    : <FileText className="size-4" />}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{item.title}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {item.typeName.charAt(0).toUpperCase() + item.typeName.slice(1)}
                    {item.collectionName ? ` · ${item.collectionName}` : ""}
                  </p>
                </div>
              </div>
              {item.description ? (
                <SheetDescription className="mt-3 text-sm leading-relaxed">
                  {item.description}
                </SheetDescription>
              ) : null}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {item.content ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Content
                  </p>
                  <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/90 leading-relaxed">
                    {item.content}
                  </pre>
                </div>
              ) : null}

              {item.url ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    URL
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 break-all hover:underline"
                  >
                    {item.url}
                  </a>
                </div>
              ) : null}

              {item.fileName ? (
                <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    File
                  </p>
                  <p className="text-sm">{item.fileName}</p>
                  {item.fileSize ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.fileSize > 1024
                        ? `${(item.fileSize / 1024).toFixed(1)} KB`
                        : `${item.fileSize} bytes`}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {item.tags.length > 0 ? (
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
              ) : null}
            </div>

            <div className="border-t border-border/70 p-4 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
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
                  onClick={() => setIsPinned(!isPinned)}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  aria-label={isPinned ? "Unpin" : "Pin"}
                >
                  <Pin
                    className={cn(
                      "size-5",
                      isPinned ? "text-foreground" : "text-muted-foreground",
                    )}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  aria-label="Copy content"
                >
                  <Copy className="size-5 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 hover:bg-muted transition-colors"
                  aria-label="Edit"
                >
                  <Pencil className="size-5 text-muted-foreground" />
                </button>
              </div>
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-red-500/10 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="size-5 text-muted-foreground hover:text-red-400" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Failed to load item.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
