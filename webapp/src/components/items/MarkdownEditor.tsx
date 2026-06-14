"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, Eye, Pencil, Sparkles, Loader2, Crown, X, SquarePen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  isPro?: boolean;
  typeName?: string;
  onOptimize?: () => Promise<string | null>;
  onApplyOptimized?: (optimizedText: string) => Promise<void>;
};

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  isPro = false,
  typeName,
  onOptimize,
  onApplyOptimized,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const showOptimize = readOnly && isPro !== undefined && typeName === "prompt";

  const handleCopy = useCallback(() => {
    const text = optimizedText ?? value;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value, optimizedText]);

  const handleOptimize = useCallback(async () => {
    if (!onOptimize || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizedText(null);
    const result = await onOptimize();
    setIsOptimizing(false);
    if (result) {
      setOptimizedText(result);
    }
  }, [onOptimize, isOptimizing]);

  const handleAccept = useCallback(async () => {
    if (!optimizedText || !onApplyOptimized || isApplying) return;
    setIsApplying(true);
    await onApplyOptimized(optimizedText);
    setIsApplying(false);
    setOptimizedText(null);
  }, [optimizedText, onApplyOptimized, isApplying]);

  const handleReject = useCallback(() => {
    setOptimizedText(null);
  }, []);

  const editorHeight = useMemo(() => {
    const text = optimizedText ?? value;
    const lines = Math.max((text.match(/\n/g) || []).length + 1, 2);
    if (!text) return 160;
    return Math.min(lines * 24 + 52, 400);
  }, [value, optimizedText]);

  const displayText = optimizedText ?? value;

  return (
    <div className="rounded-xl border border-border/70 overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-border/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          {!readOnly ? (
            <div className="flex items-center gap-0.5 rounded-md bg-[#1e1e1e] p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === "write"
                    ? "bg-[#3d3d3d] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Pencil className="size-3" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === "preview"
                    ? "bg-[#3d3d3d] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Eye className="size-3" />
                Preview
              </button>
            </div>
          ) : optimizedText ? (
            <div className="flex items-center gap-1 text-[11px]">
              <SquarePen className="size-3 text-purple-400" />
              <span className="font-medium text-purple-300">Optimized</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono truncate">
              Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showOptimize ? (
            isPro ? (
              <button
                type="button"
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="rounded-md p-1.5 hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Optimize prompt"
              >
                {isOptimizing ? (
                  <Loader2 className="size-3.5 text-purple-400 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5 text-zinc-500 hover:text-purple-400 transition-colors" />
                )}
              </button>
            ) : (
              <span
                className="rounded-md p-1.5 shrink-0"
                aria-label="AI features require Pro subscription"
                title="AI features require Pro subscription"
              >
                <Crown className="size-3.5 text-zinc-600" />
              </span>
            )
          ) : null}
          {optimizedText ? (
            <>
              <button
                type="button"
                onClick={handleReject}
                disabled={isApplying}
                className="rounded-md p-1.5 hover:bg-red-500/10 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Reject optimized prompt"
              >
                <X className="size-3.5 text-zinc-500 hover:text-red-400 transition-colors" />
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isApplying}
                className="rounded-md p-1.5 hover:bg-emerald-500/10 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Apply optimized prompt"
              >
                {isApplying ? (
                  <Loader2 className="size-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <Check className="size-3.5 text-zinc-500 hover:text-emerald-400 transition-colors" />
                )}
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1.5 hover:bg-white/10 transition-colors shrink-0"
            aria-label={copied ? "Copied" : "Copy content"}
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5 text-zinc-500" />
            )}
          </button>
        </div>
      </div>

      {isOptimizing ? (
        <div className="flex items-center justify-center py-8 text-sm text-zinc-500" style={{ minHeight: 120 }}>
          <Loader2 className="size-4 animate-spin mr-2" />
          Optimizing prompt...
        </div>
      ) : readOnly || activeTab === "preview" ? (
        <div
          className="prose prose-invert max-w-none overflow-y-auto p-4 scrollbar-thin"
          style={{ height: `${editorHeight}px` }}
        >
          {displayText ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayText}
            </ReactMarkdown>
          ) : (
            <p className="text-zinc-500 italic">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full resize-none bg-transparent p-4 text-sm font-mono text-zinc-200 placeholder:text-zinc-500 focus:outline-none overflow-x-hidden scrollbar-thin"
          style={{ height: `${editorHeight}px` }}
          placeholder="Write markdown..."
          aria-label="Markdown content"
        />
      )}
    </div>
  );
}
