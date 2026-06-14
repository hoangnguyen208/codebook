"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { TagSuggestions } from "@/components/items/TagSuggestions";
import { CollectionMultiSelect } from "@/components/items/CollectionMultiSelect";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import { inputClasses } from "@/lib/item-type-config";
import type { CollectionForSelect, ItemDetail } from "@/types/items";
import type { SuggestionState } from "@/hooks/use-tag-suggestions";

type Props = {
  editContent: string;
  setEditContent: (value: string) => void;
  editLanguage: string;
  setEditLanguage: (value: string) => void;
  editUrl: string;
  setEditUrl: (value: string) => void;
  editTagsInput: string;
  setEditTagsInput: (value: string) => void;
  item: ItemDetail;
  isPro: boolean;
  handleSuggestTags: () => Promise<void>;
  handleAcceptSuggestion: (tag: string) => void;
  handleRejectSuggestion: (tag: string) => void;
  tagSuggestions: SuggestionState[];
  loadingSuggestions: boolean;
  availableCollections: CollectionForSelect[];
  selectedCollectionIds: string[];
  setSelectedCollectionIds: (ids: string[]) => void;
  showContentEdit: boolean;
  showCodeEditor: boolean;
  showLanguageEdit: boolean;
  showUrlEdit: boolean;
};

export function DrawerItemEdit({
  editContent,
  setEditContent,
  editLanguage,
  setEditLanguage,
  editUrl,
  setEditUrl,
  editTagsInput,
  setEditTagsInput,
  item,
  isPro,
  handleSuggestTags,
  handleAcceptSuggestion,
  handleRejectSuggestion,
  tagSuggestions,
  loadingSuggestions,
  availableCollections,
  selectedCollectionIds,
  setSelectedCollectionIds,
  showContentEdit,
  showCodeEditor,
  showLanguageEdit,
  showUrlEdit,
}: Props) {
  return (
    <>
      {showContentEdit ? (
        <>
          {showLanguageEdit ? (
            <div className="rounded-xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Language
              </p>
              <select
                value={editLanguage}
                onChange={(e) => setEditLanguage(e.target.value)}
                className={cn(inputClasses, "cursor-pointer")}
                aria-label="Language"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ) : null}
          {showCodeEditor ? (
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
          )}
        </>
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

      <div className="rounded-xl border border-border/70 bg-background/70 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Tags
        </p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={editTagsInput}
            onChange={(e) => setEditTagsInput(e.target.value)}
            className={cn(inputClasses, "flex-1")}
            placeholder="comma, separated, tags"
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
        <div className="mt-3">
          <TagSuggestions
            suggestions={tagSuggestions}
            onAccept={handleAcceptSuggestion}
            onReject={handleRejectSuggestion}
            loading={loadingSuggestions}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-background/70 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Collections
        </p>
        <CollectionMultiSelect
          collections={availableCollections}
          selectedIds={selectedCollectionIds}
          onChange={setSelectedCollectionIds}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Type: {item.typeName}</span>
        <span>Updated: {item.updatedAt}</span>
      </div>
    </>
  );
}
