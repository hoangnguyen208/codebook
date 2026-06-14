export const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

export function getColorClasses(color: string): string {
  return colorClasses[color] ?? "border-border bg-muted text-muted-foreground";
}

const dotColorClasses: Record<string, string> = {
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  orange: "bg-orange-400",
  yellow: "bg-yellow-400",
  slate: "bg-slate-400",
  pink: "bg-pink-400",
  emerald: "bg-emerald-400",
};

export function getDotColorClass(color: string): string {
  return dotColorClasses[color] ?? "bg-muted-foreground";
}

export const colorTokenMap: Record<string, string> = {
  "#3b82f6": "blue",
  "#8b5cf6": "purple",
  "#f97316": "orange",
  "#fde047": "yellow",
  "#6b7280": "slate",
  "#ec4899": "pink",
  "#10b981": "emerald",
};

const typeColorNames: Record<string, string> = {
  snippet: "blue",
  prompt: "purple",
  command: "orange",
  note: "yellow",
  file: "slate",
  image: "pink",
  link: "emerald",
};

export function getItemColor(typeName: string, typeColor?: string | null): string {
  const token =
    typeColorNames[typeName.toLowerCase()] ??
    (typeColor ? colorTokenMap[typeColor.toLowerCase()] : null) ??
    "slate";
  return colorClasses[token] ?? "border-border bg-muted text-muted-foreground";
}
