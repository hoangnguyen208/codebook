"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import Editor from "@monaco-editor/react";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value]);

  const displayLang = (language || "plaintext").trim();

  const editorHeight = useMemo(() => {
    const lines = Math.max((value.match(/\n/g) || []).length + 1, 2);
    if (!value) return 120;
    return Math.min(lines * 22 + 40, 400);
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
          <span className="text-[11px] text-zinc-500 font-mono truncate">
            {displayLang}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md p-1.5 hover:bg-white/10 transition-colors shrink-0"
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-400" />
          ) : (
            <Copy className="size-3.5 text-zinc-500" />
          )}
        </button>
      </div>
      <Editor
        value={value}
        onChange={(v) => onChange?.(v ?? "")}
        language={displayLang}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          fontSize: 13,
          fontFamily:
            "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
          lineHeight: 1.6,
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          contextmenu: false,
          renderLineHighlight: "none",
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
        height={`${editorHeight}px`}
        loading={
          <div className="flex items-center justify-center h-[120px] text-sm text-zinc-500 bg-[#1e1e1e]">
            Loading editor...
          </div>
        }
      />
    </div>
  );
}
