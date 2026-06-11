"use client";

import { useEditorPreferences } from "@/components/settings/EditorPreferencesProvider";

const fontSizes = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24];
const tabSizes = [2, 4, 8];
const themes: Record<string, string> = {
  "vs-dark": "VS Dark",
  monokai: "Monokai",
  "github-dark": "GitHub Dark",
};

const selectClasses = "h-9 rounded-lg border border-border/60 bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 cursor-pointer";

export function EditorPreferencesSection() {
  const { prefs, update } = useEditorPreferences();

  const toggle = (key: "wordWrap" | "minimap") => {
    update({ [key]: !prefs[key] });
  };

  return (
    <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
      <h2 className="mb-1 text-base font-semibold">Editor</h2>
      <p className="mb-6 text-sm text-muted-foreground">Customize the code editor appearance and behavior.</p>

      <div className="divide-y divide-border/50">
        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Font size</p>
            <p className="text-xs text-muted-foreground">Controls the text size in the code editor.</p>
          </div>
          <select
            value={prefs.fontSize ?? 14}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
            className={selectClasses}
          >
            {fontSizes.map((s) => (<option key={s} value={s}>{s}px</option>))}
          </select>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Tab size</p>
            <p className="text-xs text-muted-foreground">Number of spaces per tab.</p>
          </div>
          <select
            value={prefs.tabSize ?? 2}
            onChange={(e) => update({ tabSize: Number(e.target.value) })}
            className={selectClasses}
          >
            {tabSizes.map((s) => (<option key={s} value={s}>{s} spaces</option>))}
          </select>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">Color theme for the editor.</p>
          </div>
          <select
            value={prefs.theme ?? "vs-dark"}
            onChange={(e) => update({ theme: e.target.value })}
            className={selectClasses}
          >
            {Object.entries(themes).map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
          </select>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Word wrap</p>
            <p className="text-xs text-muted-foreground">Lines wrap to fit within the editor.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={prefs.wordWrap ?? true} onChange={() => toggle("wordWrap")} className="sr-only peer" />
            <div className="w-9 h-5 rounded-full peer bg-muted peer-checked:bg-emerald-500/60 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        <div className="flex items-center justify-between py-4">
          <div>
            <p className="text-sm font-medium">Minimap</p>
            <p className="text-xs text-muted-foreground">Show a code overview minimap.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={prefs.minimap ?? false} onChange={() => toggle("minimap")} className="sr-only peer" />
            <div className="w-9 h-5 rounded-full peer bg-muted peer-checked:bg-emerald-500/60 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>
      </div>
    </section>
  );
}
