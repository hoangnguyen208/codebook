export const ITEM_TYPES = [
  { name: "snippet", label: "Snippet" },
  { name: "prompt", label: "Prompt" },
  { name: "command", label: "Command" },
  { name: "note", label: "Note" },
  { name: "file", label: "File" },
  { name: "image", label: "Image" },
  { name: "link", label: "Link" },
] as const;

export const HAS_CONTENT = new Set(["snippet", "prompt", "command", "note"]);
export const HAS_CODE_EDITOR = new Set(["snippet", "command"]);
export const HAS_LANGUAGE = new Set(["snippet", "command"]);
export const HAS_URL = new Set(["link"]);
export const HAS_FILE_UPLOAD = new Set(["file", "image"]);

export const PRO_ONLY_TYPES = new Set(["file", "image"]);

export const inputClasses =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";
