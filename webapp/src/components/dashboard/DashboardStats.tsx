import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardStat = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClassName?: string;
};

export function DashboardStats({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <article
            key={stat.label}
            className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70">
                <Icon className={cn("size-5", stat.iconClassName ?? "text-muted-foreground")} />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {stat.description}
            </p>
          </article>
        );
      })}
    </section>
  );
}
