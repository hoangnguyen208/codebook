import { Sparkles, Check } from "lucide-react";

const aiFeatures = [
  "Auto-generate tags from code context",
  "Summarize long documents instantly",
  "Generate commit messages from diffs",
  "Create descriptions from file content",
];

export function AISection() {
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500/20 to-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
          <Sparkles className="mr-1.5 size-3" />
          Pro Feature
        </span>

        <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          AI That Understands
          <br />
          Your Codebase
        </h3>

        <ul className="space-y-3">
          {aiFeatures.map((f, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                <Check className="size-3.5" />
              </span>
              <span className="text-sm text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <div className="absolute -inset-1 rounded-2xl bg-blue-500/20 blur-2xl" />
        <div className="relative rounded-xl border border-border/40 bg-card/80 overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-border/40 px-4 py-2.5">
            <span className="size-2.5 rounded-full bg-red-500/60" />
            <span className="size-2.5 rounded-full bg-amber-500/60" />
            <span className="size-2.5 rounded-full bg-green-500/60" />
            <span className="ml-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              snapshot.ts — JSON
            </span>
          </div>

          <div className="p-4 font-mono text-xs leading-relaxed">
            <div className="text-muted-foreground">
              <span className="text-amber-400">&quot;tags&quot;</span>
              <span>: [</span>
            </div>
            <div className="pl-3">
              <span className="text-green-400">&quot;react&quot;</span>
              <span className="text-muted-foreground">,</span>
            </div>
            <div className="pl-3">
              <span className="text-green-400">&quot;hooks&quot;</span>
              <span className="text-muted-foreground">,</span>
            </div>
            <div className="pl-3">
              <span className="text-green-400">&quot;state&quot;</span>
              <span className="text-muted-foreground">,</span>
            </div>
            <div className="pl-3">
              <span className="text-green-400">&quot;typescript&quot;</span>
            </div>
            <div className="text-muted-foreground">],</div>
            <div className="mt-1 animate-pulse text-amber-400/60">
              &nbsp;&nbsp;// AI Generated Tags
            </div>
          </div>

          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-medium text-amber-400">
              <Sparkles className="size-2.5" />
              AI Generated Tags
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
