"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    router.push(`${pathname}?page=${page}`);
  };

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      <button
        type="button"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
        className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4" />
        Prev
      </button>

      {start > 1 ? (
        <>
          <button type="button" onClick={() => goToPage(1)} className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors min-w-10 text-center">1</button>
          {start > 2 ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
        </>
      ) : null}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => goToPage(p)}
          className={p === currentPage ? "rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background min-w-10 text-center" : "rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors min-w-10 text-center"}
        >
          {p}
        </button>
      ))}

      {end < totalPages ? (
        <>
          {end < totalPages - 1 ? <span className="px-1 text-sm text-muted-foreground">...</span> : null}
          <button type="button" onClick={() => goToPage(totalPages)} className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors min-w-10 text-center">{totalPages}</button>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
