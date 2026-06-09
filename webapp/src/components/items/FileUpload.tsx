"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, File, FileImage, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadResult = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  contentType: "image" | "file";
};

type Props = {
  value: UploadResult | null;
  onChange: (result: UploadResult | null) => void;
  accept: "image" | "file";
  disabled?: boolean;
};

const ACCEPT_MAP: Record<"image" | "file", string> = {
  image: ".png,.jpg,.jpeg,.gif,.webp,.svg",
  file: ".pdf,.txt,.md,.json,.yaml,.yml,.xml,.csv,.toml,.ini",
};

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} bytes`;
}

export function FileUpload({ value, onChange, accept, disabled }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = accept === "image";

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 150);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Upload failed");
        }

        setProgress(100);
        const result = (await res.json()) as UploadResult;
        onChange(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        onChange(null);
      } finally {
        clearInterval(progressInterval);
        setUploading(false);
        setTimeout(() => setProgress(0), 500);
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;

      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [disabled, uploading, uploadFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadFile],
  );

  const Icon = isImage ? FileImage : File;

  if (value) {
    return (
      <div className="rounded-xl border border-border/70 bg-background/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {isImage ? (
                <Image
                  src={value.fileUrl}
                  alt={value.fileName}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-cover"
                  unoptimized
                />
              ) : (
                <Icon className="size-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatSize(value.fileSize)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
        {isImage && (
          <div className="mt-3">
            <Image
              src={value.fileUrl}
              alt={value.fileName}
              width={400}
              height={192}
              className="w-full max-h-48 rounded-lg object-cover"
              unoptimized
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "rounded-xl border-2 border-dashed border-border/70 p-8 text-center cursor-pointer transition-colors",
          dragOver && "border-foreground/30 bg-foreground/5",
          (disabled || uploading) && "opacity-50 cursor-not-allowed",
          !dragOver && "hover:border-foreground/20 hover:bg-muted/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_MAP[accept]}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-muted-foreground animate-spin" />
            <div className="w-48 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground/50 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isImage ? "Drop an image or click to browse" : "Drop a file or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isImage
                ? "PNG, JPG, GIF, WebP, SVG up to 5 MB"
                : "PDF, TXT, MD, JSON, YAML, XML, CSV, TOML, INI up to 10 MB"}
            </p>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
