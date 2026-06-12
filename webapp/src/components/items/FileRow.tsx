"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { File, FileCode, FileImage, FileText, Download, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardItem } from "@/types/items";
import { toggleFavoriteItem } from "@/actions/items";

type FileRowProps = {
  item: DashboardItem;
  onClick?: (itemId: string) => void;
};

function getFileExtension(fileName: string | null): string {
  if (!fileName) return "";
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(dot + 1).toLowerCase() : "";
}

function getFileIconType(extension: string): "code" | "image" | "text" | "generic" {
  const codeExts = ["js", "jsx", "ts", "tsx", "py", "rb", "cs", "java", "go", "rs", "css", "html", "json", "xml", "yaml", "yml", "sh", "bash", "sql"];
  const imageExts = ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"];
  const textExts = ["md", "txt", "log", "csv", "pdf"];
  if (codeExts.includes(extension)) return "code";
  if (imageExts.includes(extension)) return "image";
  if (textExts.includes(extension)) return "text";
  return "generic";
}

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} bytes`;
}

function fileNameWithoutExt(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > -1 ? fileName.slice(0, dot) : fileName;
}

export function FileRow({ item, onClick }: FileRowProps) {
  const router = useRouter();
  const ext = getFileExtension(item.fileName);
  const iconType = getFileIconType(ext);
  const displayName = item.fileName ? fileNameWithoutExt(item.fileName) : item.title;
  const [isFavorite, setIsFavorite] = useState(item.isFavorite);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- sync when router.refresh updates props */
    setIsFavorite(item.isFavorite);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [item.isFavorite]);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    window.open(`/api/items/${encodeURIComponent(item.id)}/download`, "_blank");
  }

  return (
    <div
      onClick={onClick ? () => onClick(item.id) : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 p-4",
        onClick && "cursor-pointer hover:bg-accent/50 transition-colors",
        "max-sm:flex-col max-sm:items-stretch",
      )}
    >
      <div className="flex shrink-0 items-center justify-center size-10 rounded-xl bg-muted">
        {iconType === "code" ? (
          <FileCode className="size-5 text-muted-foreground" />
        ) : iconType === "image" ? (
          <FileImage className="size-5 text-muted-foreground" />
        ) : iconType === "text" ? (
          <FileText className="size-5 text-muted-foreground" />
        ) : (
          <File className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", "max-sm:text-center")}>
        <p className="text-sm font-medium truncate">{displayName}</p>
        <div className={cn("flex items-center gap-3 text-xs text-muted-foreground mt-0.5", "max-sm:flex-col max-sm:gap-0.5 max-sm:items-center")}>
          {item.fileName ? (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              .{ext || "file"}
            </span>
          ) : null}
          {item.fileSize != null ? (
            <span>{formatSize(item.fileSize)}</span>
          ) : null}
          <span>{item.createdAt}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setFavoriteLoading(true);
            toggleFavoriteItem(item.id).then((result) => {
              if (result.success === true) {
                setIsFavorite(result.data);
                router.refresh();
              }
              setFavoriteLoading(false);
            });
          }}
          disabled={favoriteLoading}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "size-4",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground",
            )}
          />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-lg border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            "max-sm:w-full max-sm:justify-center",
          )}
        >
          <Download className="size-3.5" />
          Download
        </button>
      </div>
    </div>
  );
}
