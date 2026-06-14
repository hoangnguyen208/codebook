"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateAutoTags } from "@/actions/ai";

export type SuggestionState = {
  tag: string;
  status: "pending" | "accepted" | "rejected";
};

export function useTagSuggestions(
  title: string,
  content: string,
  tagsInput: string,
  setTagsInput: (value: string | ((prev: string) => string)) => void,
) {
  const [tagSuggestions, setTagSuggestions] = useState<SuggestionState[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  return {
    tagSuggestions,
    loadingSuggestions,
    handleSuggestTags,
    handleAcceptSuggestion,
    handleRejectSuggestion,
    setTagSuggestions,
  };
}
