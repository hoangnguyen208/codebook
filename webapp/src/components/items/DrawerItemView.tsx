"use client";

import Image from "next/image";
import { Download, File } from "lucide-react";
import { CodeEditor } from "@/components/items/CodeEditor";
import { MarkdownEditor } from "@/components/items/MarkdownEditor";
import { HAS_CODE_EDITOR } from "@/lib/item-type-config";
import type { ItemDetail } from "@/types/items";

type Props = {
  item: ItemDetail;
  isPro: boolean;
  handleExplainCode: () => Promise<string | null>;
  handleOptimizePrompt: () => Promise<string | null>;
  handleApplyOptimized: (optimizedText: string) => Promise<void>;
  handleDownload: () => void;
};

export function DrawerItemView({
  item,
  isPro,
  handleExplainCode,
  handleOptimizePrompt,
  handleApplyOptimized,
  handleDownload,
}: Props) {
  const showCodeEditor = HAS_CODE_EDITOR.has(item.typeName);

  return (
    <>
      {item.content ? (
        showCodeEditor ? (
          <CodeEditor
            value={item.content}
            language={item.language ?? undefined}
            readOnly
            isPro={isPro}
            typeName={item.typeName}
            onExplain={handleExplainCode}
          />
        ) : (
          <MarkdownEditor
            value={item.content}
            readOnly
            isPro={isPro}
            typeName={item.typeName}
            onOptimize={handleOptimizePrompt}
            onApplyOptimized={handleApplyOptimized}
          />
        )
      ) : null}

      {item.url ? (
        <div className="rounded-xl border border-border/70 bg-background/70 p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            URL
          </p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 break-all hover:underline"
          >
            {item.url}
          </a>
        </div>
      ) : null}

      {item.fileName ? (
        <div className="rounded-xl border border-border/70 bg-background/70 p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            File
          </p>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {item.typeName === "image" && item.fileUrl ? (
                <Image
                  src={item.fileUrl}
                  alt={item.fileName}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <File className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.fileName}</p>
              {item.fileSize ? (
                <p className="text-xs text-muted-foreground">
                  {item.fileSize > 1024 * 1024
                    ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
                    : item.fileSize > 1024
                      ? `${(item.fileSize / 1024).toFixed(1)} KB`
                      : `${item.fileSize} bytes`}
                </p>
              ) : null}
            </div>
          </div>
          {item.typeName === "image" && item.fileUrl ? (
            <Image
              src={item.fileUrl}
              alt={item.fileName}
              width={400}
              height={256}
              className="w-full max-h-64 rounded-lg object-cover"
              unoptimized
            />
          ) : null}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="size-4" />
            Download
          </button>
        </div>
      ) : null}

      {item.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
