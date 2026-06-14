"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createItem } from "@/actions/items";
import { generateAutoTags, generateDescription } from "@/actions/ai";
import { getCollectionsForSelectAction } from "@/actions/collections";
import type { CollectionForSelect } from "@/types/items";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { FileUpload } from "@/components/items/FileUpload";
import { TagSuggestions } from "@/components/items/TagSuggestions";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
const ITEM_TYPES = [
  { name: "snippet", label: "Snippet" },
  { name: "prompt", label: "Prompt" },
  { name: "command", label: "Command" },
  { name: "note", label: "Note" },
  { name: "file", label: "File" },
  { name: "image", label: "Image" },
  { name: "link", label: "Link" },
] as const;

const HAS_CONTENT = new Set(["snippet", "prompt", "command", "note"]);
const HAS_CODE_EDITOR = new Set(["snippet", "command"]);
const HAS_LANGUAGE = new Set(["snippet", "command"]);
const HAS_URL = new Set(["link"]);
const HAS_FILE_UPLOAD = new Set(["file", "image"]);

const inputClasses =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: string;
  initialCollectionId?: string;
  isPro?: boolean;
};

type TagSuggestionState = {
  tag: string;
  status: "pending" | "accepted" | "rejected";
};

export function CreateItemDialog({ open, onOpenChange, initialType, initialCollectionId, isPro = false }: Props) {
  const router = useRouter();
  const hasPresetType = typeof initialType === "string" && initialType.trim().length > 0;
  const initialCols = typeof initialCollectionId === "string" && initialCollectionId.trim().length > 0
    ? [initialCollectionId]
    : [];

  const [typeName, setTypeName] = useState(hasPresetType ? initialType! : "snippet");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const [url, setUrl] = useState("");
  const [fileUpload, setFileUpload] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    contentType: "image" | "file";
  } | null>(null);
  const [tagsInput, setTagsInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCollections, setAvailableCollections] = useState<CollectionForSelect[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(initialCols);
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestionState[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);

  useEffect(() => {
    if (open) {
      getCollectionsForSelectAction().then(setAvailableCollections).catch(() => {});
    }
  }, [open]);

  const reset = () => {
    setTypeName(hasPresetType ? initialType! : "snippet");
    setTitle("");
    setDescription("");
    setContent("");
    setLanguage("");
    setUrl("");
    setFileUpload(null);
    setTagsInput("");
    setError(null);
    setSelectedCollectionIds(initialCols);
    setTagSuggestions([]);
    setLoadingSuggestions(false);
    setLoadingDescription(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSuggestTags = async () => {
    if (!title.trim()) {
      toast.error("Enter a title first to get tag suggestions");
      return;
    }

    setLoadingSuggestions(true);
    setTagSuggestions([]);

    const result = await generateAutoTags({
      title: title.trim(),
      content: content.trim() || null,
    });

    setLoadingSuggestions(false);

    if (result.success) {
      setTagSuggestions(
        result.data.map((tag) => ({ tag, status: "pending" as const })),
      );
    } else {
      toast.error(result.error);
    }
  };

  const handleAcceptSuggestion = (tag: string) => {
    setTagSuggestions((prev) =>
      prev.map((s) => (s.tag === tag ? { ...s, status: "accepted" as const } : s)),
    );
    const existing = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
    if (!existing.includes(tag)) {
      setTagsInput((prev) => (prev.trim() ? `${prev}, ${tag}` : tag));
    }
  };

  const handleRejectSuggestion = (tag: string) => {
    setTagSuggestions((prev) =>
      prev.map((s) => (s.tag === tag ? { ...s, status: "rejected" as const } : s)),
    );
  };

  const handleGenerateDescription = async () => {
    setLoadingDescription(true);
    const result = await generateDescription({
      title: title.trim() || null,
      content: content.trim() || null,
      typeName: typeName || null,
      language: language.trim() || null,
      url: url.trim() || null,
    });
    setLoadingDescription(false);
    if (result.success) {
      setDescription(result.data);
    } else {
      toast.error(result.error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const result = await createItem({
      title: title.trim(),
      typeName,
      description: description.trim() || null,
      content: content.trim() || null,
      url: url.trim() || null,
      language: language.trim() || null,
      fileUrl: fileUpload?.fileUrl ?? null,
      fileName: fileUpload?.fileName ?? null,
      fileSize: fileUpload?.fileSize ?? null,
      contentType: fileUpload?.contentType ?? null,
      tags,
      collectionIds: selectedCollectionIds,
    });

    setSaving(false);

    if (result.success) {
      router.refresh();
      handleOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  const disableSave = !title.trim() || saving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>
          {hasPresetType
            ? `New ${typeName.charAt(0).toUpperCase() + typeName.slice(1)}`
            : "New item"}
        </DialogTitle>
        <DialogDescription>
          Fill in the details below to create a new item.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {!hasPresetType ? (
            <div className="flex flex-wrap gap-2">
              {ITEM_TYPES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setTypeName(t.name)}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                    typeName === t.name
                      ? "border-foreground/30 bg-foreground/10 text-foreground"
                      : "border-border/70 text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(inputClasses, "text-base font-medium")}
            placeholder="Title (required)"
            aria-label="Title"
          />

          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={cn(inputClasses, "min-h-[60px] pr-10")}
              placeholder="Description (optional)"
              aria-label="Description"
              rows={2}
            />
            {isPro ? (
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={loadingDescription}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-purple-400 transition-colors disabled:opacity-50"
                aria-label="Generate description"
                title="Generate description"
              >
                <Sparkles className="size-4" />
              </button>
            ) : null}
          </div>

          {HAS_CONTENT.has(typeName) ? (
            <>
              {HAS_LANGUAGE.has(typeName) ? (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={cn(inputClasses, "cursor-pointer")}
                  aria-label="Language"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : null}
              {HAS_CODE_EDITOR.has(typeName) ? (
                <CodeEditor
                  value={content}
                  onChange={setContent}
                  language={language}
                />
              ) : (
                <MarkdownEditor
                  value={content}
                  onChange={setContent}
                />
              )}
            </>
          ) : null}

          {HAS_FILE_UPLOAD.has(typeName) ? (
            <FileUpload
              value={fileUpload}
              onChange={setFileUpload}
              accept={typeName === "image" ? "image" : "file"}
              disabled={saving}
            />
          ) : null}

          {HAS_URL.has(typeName) ? (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClasses}
              placeholder="https://..."
              aria-label="URL"
            />
          ) : null}

          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className={cn(inputClasses, "flex-1")}
                placeholder="Tags (comma, separated)"
                aria-label="Tags"
              />
              {isPro ? (
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  disabled={loadingSuggestions}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition-colors disabled:opacity-50 shrink-0"
                  aria-label="Suggest tags"
                >
                  <Sparkles className="size-4" />
                  {loadingSuggestions ? "Thinking..." : "Suggest"}
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated list of tags
            </p>
          </div>

          <TagSuggestions
            suggestions={tagSuggestions}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            loading={loadingSuggestions}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Collections
            </p>
            {availableCollections.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableCollections.map((col) => {
                  const selected = selectedCollectionIds.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() =>
                        setSelectedCollectionIds((prev) =>
                          selected
                            ? prev.filter((id) => id !== col.id)
                            : [...prev, col.id],
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
            ) : (
              <p className="text-xs text-muted-foreground">
                No collections yet. Create one first from the dashboard to assign items.
              </p>
            )}
          </div>

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disableSave}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Plus className="size-4" />
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
