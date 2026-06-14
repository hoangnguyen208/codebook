"use client";

import { Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type TagSuggestion = {
  tag: string;
  status: "pending" | "accepted" | "rejected";
};

type Props = {
  suggestions: TagSuggestion[];
  onAccept: (tag: string) => void;
  onReject: (tag: string) => void;
  loading?: boolean;
};

export function TagSuggestions({ suggestions, onAccept, onReject, loading }: Props) {
  if (suggestions.length === 0 && !loading) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="size-3.5 text-purple-400" />
        <p className="text-xs font-medium text-purple-400">AI Suggestions</p>
      </div>
      {loading ? (
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
          <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
          <div className="h-6 w-12 rounded-full bg-muted animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <span
              key={s.tag}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                s.status === "accepted"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : s.status === "rejected"
                    ? "border-red-500/20 bg-red-500/5 text-muted-foreground line-through"
                    : "border-purple-500/30 bg-purple-500/10 text-purple-300",
              )}
            >
              {s.tag}
              {s.status === "pending" ? (
                <>
                  <button
                    type="button"
                    onClick={() => onAccept(s.tag)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-500/20 transition-colors"
                    aria-label={`Accept "${s.tag}"`}
                  >
                    <Check className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(s.tag)}
                    className="rounded-full p-0.5 hover:bg-red-500/20 transition-colors"
                    aria-label={`Reject "${s.tag}"`}
                  >
                    <X className="size-3" />
                  </button>
                </>
              ) : null}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
