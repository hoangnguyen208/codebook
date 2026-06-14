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
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { useGenerateDescription } from "@/hooks/use-generate-description";
import { getCollectionsForSelectAction } from "@/actions/collections";
import type { CollectionForSelect } from "@/types/items";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { FileUpload } from "@/components/items/FileUpload";
import { TagSuggestions } from "@/components/items/TagSuggestions";
import { CollectionMultiSelect } from "@/components/items/CollectionMultiSelect";
import { TypeSelector } from "@/components/items/TypeSelector";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { HAS_CONTENT, HAS_CODE_EDITOR, HAS_LANGUAGE, HAS_URL, HAS_FILE_UPLOAD, inputClasses } from "@/lib/item-type-config";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: string;
  initialCollectionId?: string;
  isPro?: boolean;
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

  useEffect(() => {
    if (open) {
      getCollectionsForSelectAction().then(setAvailableCollections).catch(() => {});
    }
  }, [open]);

  const { tagSuggestions, loadingSuggestions, handleSuggestTags, handleAcceptSuggestion, handleRejectSuggestion, setTagSuggestions } = useTagSuggestions(title, content, tagsInput, setTagsInput);
  const { loadingDescription, handleGenerateDescription } = useGenerateDescription(title, content, typeName, language, url, setDescription);

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
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
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
            <TypeSelector selected={typeName} onChange={setTypeName} />
          ) : null}

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={cn(inputClasses, "text-base font-medium")}
            placeholder="Title (required)"
            aria-label="Title"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(inputClasses, "min-h-[60px]")}
            placeholder="Description (optional)"
            aria-label="Description"
            rows={2}
          />
          {isPro ? (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={loadingDescription}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-purple-400 transition-colors disabled:opacity-50"
              >
                <Sparkles className="size-3.5" />
                {loadingDescription ? "Generating..." : "Generate description"}
              </button>
            </div>
          ) : null}

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
            <CollectionMultiSelect
              collections={availableCollections}
              selectedIds={selectedCollectionIds}
              onChange={setSelectedCollectionIds}
            />
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
