import type { LucideIcon } from "lucide-react";
import {
  Code2,
  File,
  FileImage,
  FileText,
  Link2,
  Sparkles,
  Terminal,
} from "lucide-react";

export const itemTypeIcons: Record<string, LucideIcon> = {
  code: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "file-text": FileText,
  file: File,
  image: FileImage,
  link: Link2,
};

export function resolveItemIcon(iconName: string | null): LucideIcon {
  if (!iconName) return FileText;
  const key = normaliseIconKey(iconName);
  return itemTypeIcons[key] ?? FileText;
}

function normaliseIconKey(name: string): string {
  const lowered = name.trim().toLowerCase();
  switch (lowered) {
    case "code":
    case "code2":
      return "code";
    case "sparkles":
      return "sparkles";
    case "terminal":
      return "terminal";
    case "stickynote":
    case "filetext":
    case "file-text":
      return "file-text";
    case "file":
      return "file";
    case "image":
    case "fileimage":
      return "image";
    case "link":
    case "link2":
      return "link";
    default:
      return "file-text";
  }
}
