"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  File,
  FileImage,
  FileText,
  Link2,
  Pencil,
  Pin,
  Sparkles,
  Star,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
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
import { updateItem, deleteItem } from "@/actions/items";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
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

const HAS_CONTENT_EDIT = new Set(["snippet", "prompt", "command", "note"]);
const HAS_CODE_EDITOR = new Set(["snippet", "command"]);
const HAS_LANGUAGE_EDIT = new Set(["snippet", "command"]);
const HAS_URL_EDIT = new Set(["link"]);

type StatusBanner = {
  type: "success" | "error";
  message: string;
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

function tagsToInput(tags: string[]): string {
  return tags.join(", ");
}

function inputToTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

const inputClasses =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

export function ItemDrawerSheet() {
  const { isOpen, selectedItemId, closeDrawer } = useItemDrawer();
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [status, setStatus] = useState<StatusBanner | null>(null);

  // Edit form local state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editLanguage, setEditLanguage] = useState("");
  const [editUrl, setEditUrl] = useState("");

  useEffect(() => {
    if (!selectedItemId || !isOpen) {
      return;
    }

    /* eslint-disable react-hooks/set-state-in-effect -- reset state when opening drawer */
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setLoading(true);
    /* eslint-enable react-hooks/set-state-in-effect */
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

  const enterEditMode = () => {
    if (!item) return;
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditTagsInput(tagsToInput(item.tags));
    setEditContent(item.content ?? "");
    setEditLanguage(item.language ?? "");
    setEditUrl(item.url ?? "");
    setIsEditing(true);
    setStatus(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setStatus(null);
  };

  const handleSave = async () => {
    if (!item) return;
    if (!editTitle.trim()) return;

    setSaving(true);
    setStatus(null);

    const result = await updateItem(item.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      content: editContent.trim() || null,
      url: editUrl.trim() || null,
      language: editLanguage.trim() || null,
      tags: inputToTags(editTagsInput),
    });

    setSaving(false);

    if (result.success) {
      setItem(result.data as ItemDetail);
      setIsEditing(false);
      setStatus({ type: "success", message: "Item updated" });
      router.refresh();
      setTimeout(() => setStatus(null), 3000);
    } else {
      setStatus({ type: "error", message: result.error });
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    setDeleting(true);
    setStatus(null);

    const result = await deleteItem(item.id);

    setDeleting(false);

    if (result.success) {
      setStatus({ type: "success", message: "Item deleted" });
      setTimeout(() => {
        closeDrawer();
        router.refresh();
      }, 600);
    } else {
      setStatus({ type: "error", message: result.error });
    }
  };

  const handleCopy = () => {
    if (item) {
      const text = item.content ?? item.url ?? item.title;
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const typeColorClasses = item ? resolveColorClasses(item.typeName, item.typeColor) : "";
  const showContentEdit = item ? HAS_CONTENT_EDIT.has(item.typeName) : false;
  const showCodeEditor = item ? HAS_CODE_EDITOR.has(item.typeName) : false;
  const showLanguageEdit = item ? HAS_LANGUAGE_EDIT.has(item.typeName) : false;
  const showUrlEdit = item ? HAS_URL_EDIT.has(item.typeName) : false;

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
                  {(() => {
                    const Icon = resolveIcon(item.typeIcon);
                    return <Icon className="size-4" />;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className={cn(inputClasses, "text-lg font-semibold")}
                      placeholder="Title"
                      aria-label="Title"
                    />
                  ) : (
                    <SheetTitle className="truncate text-lg">{item.title}</SheetTitle>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {item.typeName.charAt(0).toUpperCase() + item.typeName.slice(1)}
                    {item.collectionName ? ` · ${item.collectionName}` : ""}
                  </p>
                </div>
              </div>
              {isEditing ? (
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className={cn(inputClasses, "mt-3 min-h-[60px]")}
                  placeholder="Description (optional)"
                  aria-label="Description"
                  rows={2}
                />
              ) : item.description ? (
                <SheetDescription className="mt-3 text-sm leading-relaxed">
                  {item.description}
                </SheetDescription>
              ) : null}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {isEditing ? (
                <>
                  {showContentEdit ? (
                    showCodeEditor ? (
                      <CodeEditor
                        value={editContent}
                        onChange={setEditContent}
                        language={editLanguage}
                      />
                    ) : (
                      <MarkdownEditor
                        value={editContent}
                        onChange={setEditContent}
                      />
                    )
                  ) : null}

                  {showUrlEdit ? (
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        URL
                      </p>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className={inputClasses}
                        placeholder="https://..."
                        aria-label="URL"
                      />
                    </div>
                  ) : null}

                  {showLanguageEdit ? (
                    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Language
                      </p>
                      <input
                        type="text"
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                        className={inputClasses}
                        placeholder="typescript, python, bash..."
                        aria-label="Language"
                      />
                    </div>
                  ) : null}

                  <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Tags
                    </p>
                    <input
                      type="text"
                      value={editTagsInput}
                      onChange={(e) => setEditTagsInput(e.target.value)}
                      className={inputClasses}
                      placeholder="comma, separated, tags"
                      aria-label="Tags"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Comma-separated list of tags
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Type: {item.typeName}</span>
                    <span>Updated: {item.updatedAt}</span>
                  </div>
                </>
              ) : (
                <>
                  {item.content ? (
                    showCodeEditor ? (
                      <CodeEditor
                        value={item.content}
                        language={item.language ?? undefined}
                        readOnly
                      />
                    ) : (
                      <MarkdownEditor
                        value={item.content}
                        readOnly
                      />
                    )
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
                </>
              )}
            </div>

            {status ? (
              <div
                className={cn(
                  "mx-6 rounded-xl px-4 py-2 text-sm font-medium",
                  status.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400",
                )}
              >
                {status.message}
              </div>
            ) : null}

            <div className="border-t border-border/70 p-4 flex items-center justify-between">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label="Cancel"
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !editTitle.trim()}
                    className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    aria-label="Save"
                  >
                    <Check className="size-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
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
                      onClick={enterEditMode}
                      className="rounded-lg p-2 hover:bg-muted transition-colors"
                      aria-label="Edit"
                    >
                      <Pencil className="size-5 text-muted-foreground" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="rounded-lg p-2 hover:bg-red-500/10 transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-5 text-muted-foreground hover:text-red-400" />
                  </button>
                </>
              )}
            </div>

            {showDeleteConfirm ? (
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
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            ) : null}
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
