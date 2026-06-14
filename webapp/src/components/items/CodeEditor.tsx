"use client";

import { useState, useMemo, useCallback } from "react";
import { Copy, Check, Sparkles, Loader2, Crown, Code2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEditorPreferences } from "@/components/settings/EditorPreferencesProvider";

type Props = {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  isPro?: boolean;
  typeName?: string;
  onExplain?: () => Promise<string | null>;
};

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  isPro = false,
  typeName,
  onExplain,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"code" | "explain">("code");
  const { prefs } = useEditorPreferences();

  const handleCopy = useCallback(() => {
    const text = activeView === "explain" && explanation ? explanation : value;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [value, activeView, explanation]);

  const showExplain = readOnly && isPro !== undefined && typeName && (typeName === "snippet" || typeName === "command");

  const handleExplain = useCallback(async () => {
    if (!onExplain || isExplaining) return;
    setIsExplaining(true);
    setExplanation(null);
    const result = await onExplain();
    setIsExplaining(false);
    if (result) {
      setExplanation(result);
      setActiveView("explain");
    }
  }, [onExplain, isExplaining]);

  const displayLang = (language || "plaintext").trim();

  const editorHeight = useMemo(() => {
    if (activeView === "explain" && explanation) return undefined;
    const lines = Math.max((value.match(/\n/g) || []).length + 1, 2);
    if (!value) return 120;
    return Math.min(lines * 22 + 40, 400);
  }, [value, activeView, explanation]);

  return (
    <div className="rounded-xl border border-border/70 overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-border/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="size-3 rounded-full bg-red-500/80" />
            <span className="size-3 rounded-full bg-amber-400/80" />
            <span className="size-3 rounded-full bg-emerald-500/80" />
          </div>
          {explanation ? (
            <div className="flex items-center gap-0.5 rounded-md bg-[#1e1e1e] p-0.5">
              <button
                type="button"
                onClick={() => setActiveView("code")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeView === "code"
                    ? "bg-[#3d3d3d] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Code2 className="size-3" />
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveView("explain")}
                className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                  activeView === "explain"
                    ? "bg-[#3d3d3d] text-zinc-200"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Sparkles className="size-3" />
                Explain
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-mono truncate">
              {displayLang}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showExplain ? (
            isPro ? (
              <button
                type="button"
                onClick={handleExplain}
                disabled={isExplaining}
                className="rounded-md p-1.5 hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Explain code"
              >
                {isExplaining ? (
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
      </div>

      {activeView === "explain" && explanation ? (
        <div className="prose prose-invert max-w-none overflow-y-auto p-4 scrollbar-thin" style={{ minHeight: 120 }}>
          {isExplaining ? (
            <div className="flex items-center justify-center py-8 text-sm text-zinc-500">
              <Loader2 className="size-4 animate-spin mr-2" />
              Generating explanation...
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {explanation}
            </ReactMarkdown>
          )}
        </div>
      ) : isExplaining ? (
        <div className="flex items-center justify-center py-8 text-sm text-zinc-500" style={{ minHeight: 120 }}>
          <Loader2 className="size-4 animate-spin mr-2" />
          Generating explanation...
        </div>
      ) : (
        <Editor
          value={value}
          onChange={(v) => onChange?.(v ?? "")}
          language={displayLang}
          theme={prefs.theme ?? "vs-dark"}
          options={{
            readOnly,
            minimap: { enabled: prefs.minimap ?? false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: prefs.wordWrap ?? true ? "on" : "off",
            fontSize: prefs.fontSize ?? 14,
            tabSize: prefs.tabSize ?? 2,
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
      )}
    </div>
  );
}
