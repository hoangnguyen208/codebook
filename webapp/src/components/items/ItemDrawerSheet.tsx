"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { cn } from "@/lib/utils";
import { updateItem, deleteItem, toggleFavoriteItem, togglePinItem } from "@/actions/items";
import { getCollectionsForSelectAction } from "@/actions/collections";
import { DrawerItemView } from "@/components/items/DrawerItemView";
import { DrawerItemEdit } from "@/components/items/DrawerItemEdit";
import { DrawerActionBar } from "@/components/items/DrawerActionBar";
import { DeleteItemConfirm } from "@/components/items/DeleteItemConfirm";
import { useTagSuggestions } from "@/hooks/use-tag-suggestions";
import { useGenerateDescription } from "@/hooks/use-generate-description";
import { useDrawerAI } from "@/hooks/use-drawer-ai";
import type { CollectionForSelect, ItemDetail } from "@/types/items";
import { resolveItemIcon } from "@/lib/icons";
import { getItemColor } from "@/lib/color-utils";
import {
  HAS_CONTENT as HAS_CONTENT_EDIT,
  HAS_CODE_EDITOR,
  HAS_LANGUAGE as HAS_LANGUAGE_EDIT,
  HAS_URL as HAS_URL_EDIT,
  inputClasses,
} from "@/lib/item-type-config";

type StatusBanner = {
  type: "success" | "error";
  message: string;
};

function tagsToInput(tags: string[]): string {
  return tags.join(", ");
}

function inputToTags(value: string): string[] {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

export function ItemDrawerSheet() {
  const { isOpen, selectedItemId, closeDrawer, isPro } = useItemDrawer();
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(false);
                  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

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
  const [availableCollections, setAvailableCollections] = useState<CollectionForSelect[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  const { tagSuggestions, loadingSuggestions, handleSuggestTags, handleAcceptSuggestion, handleRejectSuggestion, setTagSuggestions } = useTagSuggestions(editTitle, editContent, editTagsInput, setEditTagsInput);
  const { loadingDescription, handleGenerateDescription } = useGenerateDescription(editTitle, editContent, item?.typeName ?? "", editLanguage, editUrl, setEditDescription);
  const { handleExplainCode, handleOptimizePrompt, handleApplyOptimized } = useDrawerAI(item, setItem);

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
    setSelectedCollectionIds(item.collectionIds ?? []);
    setTagSuggestions([]);
    setIsEditing(true);
    setStatus(null);
    getCollectionsForSelectAction().then(setAvailableCollections).catch(() => {});
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setStatus(null);
    setTagSuggestions([]);
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
      collectionIds: selectedCollectionIds,
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
    }
  };

  const handleDownload = () => {
    if (item) {
      window.open(`/api/items/${encodeURIComponent(item.id)}/download`, "_blank");
    }
  };

  const handleFavorite = async () => {
    if (!item) return;
    setFavoriteLoading(true);
    const result = await toggleFavoriteItem(item.id);
    if (result.success === true) {
      setIsFavorite(result.data);
      router.refresh();
    }
    setFavoriteLoading(false);
  };

  const handlePin = async () => {
    if (!item) return;
    setIsPinned(!isPinned);
    setPinLoading(true);
    const result = await togglePinItem(item.id);
    if (result.success === true) {
      setIsPinned(result.data);
      router.refresh();
      toast.success(result.data ? "Item pinned" : "Item unpinned");
    } else {
      setIsPinned(isPinned);
      toast.error(result.error ?? "Failed to toggle pin");
    }
    setPinLoading(false);
  };

  const typeColorClasses = item ? getItemColor(item.typeName, item.typeColor) : "";
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
                    const Icon = resolveItemIcon(item.typeIcon);
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
                    {item.collectionNames.length > 0 ? ` · ${item.collectionNames.join(", ")}` : ""}
                  </p>
                </div>
              </div>
              {isEditing ? (
                <div className="mt-3">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
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
                </div>
              ) : item.description ? (
                <SheetDescription className="mt-3 text-sm leading-relaxed">
                  {item.description}
                </SheetDescription>
              ) : null}
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {isEditing ? (
                <DrawerItemEdit
                  editContent={editContent}
                  setEditContent={setEditContent}
                  editLanguage={editLanguage}
                  setEditLanguage={setEditLanguage}
                  editUrl={editUrl}
                  setEditUrl={setEditUrl}
                  editTagsInput={editTagsInput}
                  setEditTagsInput={setEditTagsInput}
                  item={item}
                  isPro={isPro}
                  handleSuggestTags={handleSuggestTags}
                  handleAcceptSuggestion={handleAcceptSuggestion}
                  handleRejectSuggestion={handleRejectSuggestion}
                  tagSuggestions={tagSuggestions}
                  loadingSuggestions={loadingSuggestions}
                  availableCollections={availableCollections}
                  selectedCollectionIds={selectedCollectionIds}
                  setSelectedCollectionIds={setSelectedCollectionIds}
                  showContentEdit={showContentEdit}
                  showCodeEditor={showCodeEditor}
                  showLanguageEdit={showLanguageEdit}
                  showUrlEdit={showUrlEdit}
                />
              ) : (
                <DrawerItemView
                  item={item}
                  isPro={isPro}
                  handleExplainCode={handleExplainCode}
                  handleOptimizePrompt={handleOptimizePrompt}
                  handleApplyOptimized={handleApplyOptimized}
                  handleDownload={handleDownload}
                />
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

            <DrawerActionBar
              isEditing={isEditing}
              saving={saving}
              isFavorite={isFavorite}
              isPinned={isPinned}
              favoriteLoading={favoriteLoading}
              pinLoading={pinLoading}
              canCopy={item.typeName !== "file" && item.typeName !== "image"}
              onFavorite={handleFavorite}
              onPin={handlePin}
              onCopy={handleCopy}
              onEdit={enterEditMode}
              onDelete={() => setShowDeleteConfirm(true)}
              onCancel={cancelEdit}
              onSave={handleSave}
              saveDisabled={!editTitle.trim()}
            />

            {showDeleteConfirm ? (
              <DeleteItemConfirm
                deleting={deleting}
                onDelete={handleDelete}
                onCancel={() => setShowDeleteConfirm(false)}
              />
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
