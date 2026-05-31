import Link from "next/link";
import { ArrowLeft, FolderKanban } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CollectionsPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Collections route</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            All collections
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            This route is ready for the full collections experience and is now linked
            from the dashboard sidebar.
          </p>
        </div>

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Collections</h2>
              <p className="text-sm text-muted-foreground">
                Browse, filter, and manage all collections here in the next phase.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
