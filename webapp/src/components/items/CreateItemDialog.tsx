"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createItem } from "@/actions/items";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { FileUpload } from "@/components/items/FileUpload";

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
};

export function CreateItemDialog({ open, onOpenChange, initialType }: Props) {
  const router = useRouter();
  const hasPresetType = typeof initialType === "string" && initialType.trim().length > 0;

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

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(inputClasses, "min-h-[60px]")}
            placeholder="Description (optional)"
            aria-label="Description"
            rows={2}
          />

          {HAS_CONTENT.has(typeName) ? (
            HAS_CODE_EDITOR.has(typeName) ? (
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
            )
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

          {HAS_LANGUAGE.has(typeName) ? (
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClasses}
              placeholder="Language (typescript, python...)"
              aria-label="Language"
            />
          ) : null}

          <div>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={inputClasses}
              placeholder="Tags (comma, separated)"
              aria-label="Tags"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Comma-separated list of tags
            </p>
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
