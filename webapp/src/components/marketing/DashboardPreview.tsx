function DashboardSidebar() {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="h-2.5 w-10/12 rounded bg-muted-foreground/15" />
        <div className="h-2.5 w-8/12 rounded bg-muted-foreground/10" />
        <div className="h-2.5 w-9/12 rounded bg-muted-foreground/10" />
        <div className="h-2.5 w-7/12 rounded bg-muted-foreground/10" />
      </div>
      <div className="pt-2 space-y-1">
        <div className="h-2.5 w-8/12 rounded bg-muted-foreground/10" />
        <div className="h-2.5 w-6/12 rounded bg-muted-foreground/10" />
      </div>
    </div>
  );
}

function DashboardStats() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div className="rounded bg-muted/40 p-1.5">
        <div className="h-2 w-6 rounded bg-muted-foreground/10" />
        <div className="mt-0.5 h-3 w-4 rounded bg-muted-foreground/15" />
      </div>
      <div className="rounded bg-muted/40 p-1.5">
        <div className="h-2 w-8 rounded bg-muted-foreground/10" />
        <div className="mt-0.5 h-3 w-3 rounded bg-muted-foreground/15" />
      </div>
      <div className="rounded bg-muted/40 p-1.5">
        <div className="h-2 w-8 rounded bg-muted-foreground/10" />
        <div className="mt-0.5 h-3 w-4 rounded bg-muted-foreground/15" />
      </div>
    </div>
  );
}

const cardColors = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-green-500",
  "bg-pink-500",
];

function DashboardCards() {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cardColors.map((color, i) => (
        <div
          key={i}
          className="rounded bg-muted/40 overflow-hidden"
        >
          <div className={color + " h-0.5 w-full"} />
          <div className="p-1.5 space-y-1">
            <div className="h-2 w-10/12 rounded bg-muted-foreground/10" />
            <div className="h-1.5 w-7/12 rounded bg-muted-foreground/8" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/50 p-3">
      <div className="flex gap-3">
        <div className="w-[30%]">
          <DashboardSidebar />
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded bg-muted-foreground/10" />
          <DashboardStats />
          <DashboardCards />
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
