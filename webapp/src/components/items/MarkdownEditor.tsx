"use client";

import { useState, useCallback, useMemo } from "react";
import { Copy, Check, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
};

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  const editorHeight = useMemo(() => {
    const lines = Math.max((value.match(/\n/g) || []).length + 1, 2);
    if (!value) return 160;
    return Math.min(lines * 24 + 52, 400);
  }, [value]);

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
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono truncate">
              Preview
            </span>
          )}
        </div>
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

      {readOnly || activeTab === "preview" ? (
        <div
          className="prose prose-invert max-w-none overflow-y-auto p-4 scrollbar-thin"
          style={{ height: `${editorHeight}px` }}
        >
          {value ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value}
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
