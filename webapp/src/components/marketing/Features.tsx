import {
  Code2,
  Sparkles,
  Search,
  Terminal,
  FileText,
  Layers3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Code2,
    title: "Code Snippets",
    description:
      "Save, tag, and search your favorite code patterns with syntax highlighting and instant recall.",
    accent: "border-t-blue-500",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    icon: Sparkles,
    title: "AI Prompts",
    description:
      "Store your most effective AI prompts with Markdown notes and example outputs.",
    accent: "border-t-amber-500",
    iconBg: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: Search,
    title: "Instant Search",
    description:
      "Find any snippet, prompt, or command instantly with full-text search across your entire library.",
    accent: "border-t-indigo-500",
    iconBg: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: Terminal,
    title: "Commands",
    description:
      "Keep your most-used CLI commands with descriptions and copy-to-clipboard one click away.",
    accent: "border-t-cyan-500",
    iconBg: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: FileText,
    title: "Files & Docs",
    description:
      "Upload PDFs, images, and documents. Everything searchable and organized in one place.",
    accent: "border-t-slate-400",
    iconBg: "bg-slate-400/10 text-slate-400",
  },
  {
    icon: Layers3,
    title: "Collections",
    description:
      "Group related items into collections. Pin favorites and organize by project, topic, or workflow.",
    accent: "border-t-green-500",
    iconBg: "bg-green-500/10 text-green-400",
  },
];

export function Features() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {features.map((f) => (
        <div
          key={f.title}
          className={cn(
            "group rounded-xl border border-border/40 bg-card/40",
            "border-t-2 transition-colors hover:bg-card/60",
            f.accent
          )}
        >
          <div className="p-5">
            <div
              className={cn(
                "mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg",
                f.iconBg
              )}
            >
              <f.icon className="size-5" />
            </div>
            <h3 className="text-sm font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {f.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
