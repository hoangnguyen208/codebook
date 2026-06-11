"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Clock3, Ellipsis, FolderOpen, Pencil, Star, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { deleteCollection } from "@/actions/collections";
import { EditCollectionDialog } from "@/components/collections/EditCollectionDialog";

const colorClasses: Record<string, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  purple: "border-purple-500/30 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  yellow: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  slate: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  pink: "border-pink-500/30 bg-pink-500/10 text-pink-300",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

const borderClasses: Record<string, string> = {
  blue: "border-t-2 border-t-blue-500/40 border border-border/70 border-t-blue-500/40",
  purple: "border-t-2 border-t-purple-500/40 border border-border/70 border-t-purple-500/40",
  orange: "border-t-2 border-t-orange-500/40 border border-border/70 border-t-orange-500/40",
  yellow: "border-t-2 border-t-yellow-500/40 border border-border/70 border-t-yellow-500/40",
  slate: "border-t-2 border-t-slate-500/40 border border-border/70 border-t-slate-500/40",
  pink: "border-t-2 border-t-pink-500/40 border border-border/70 border-t-pink-500/40",
  emerald: "border-t-2 border-t-emerald-500/40 border border-border/70 border-t-emerald-500/40",
};

type Props = {
  collection: {
    id: string;
    name: string;
    description: string;
    itemCount: number;
    lastUpdatedAt: string | null;
    dominantColor?: string;
    typeIcons?: string[];
  };
  lastUpdatedLabel: string;
  typeIconComponents: React.ReactNode;
};

export function DashboardCollectionCard({ collection, lastUpdatedLabel, typeIconComponents }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dominant = collection.dominantColor || "slate";
  const colorClass = colorClasses[dominant] ?? colorClasses.slate;
  const borderClass = borderClasses[dominant] ?? borderClasses.slate;

  const closeMenu = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteCollection(collection.id);
    setDeleting(false);
    closeMenu();
    if (result.success) {
      toast.success("Collection deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <div className={cn("group relative rounded-3xl bg-background/70 p-5 hover:bg-background/90 transition-colors", borderClass)}>
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen((prev) => !prev); }}
            className="rounded-lg p-1.5 opacity-0 group-hover:opacity-100 hover:bg-accent transition-opacity"
            aria-label="Collection actions"
          >
            <Ellipsis className="size-4 text-muted-foreground" />
          </button>
          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-20" onClick={closeMenu} />
              <div className="absolute right-0 top-full mt-1 z-30 min-w-36 rounded-xl border border-border/70 bg-popover p-1 shadow-lg">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(false); setEditOpen(true); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Pencil className="size-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Star className="size-4" />
                  Favorite
                </button>
                {showDeleteConfirm ? (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-muted-foreground">Remove this collection? Items will not be deleted.</p>
                    <div className="flex gap-1">
                      <button type="button" onClick={handleDelete} disabled={deleting} className="flex-1 rounded-lg bg-red-500 px-2 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50">
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDeleteConfirm(false); }} className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium hover:bg-accent">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setShowDeleteConfirm(true); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-accent transition-colors"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>

        <Link href={`/collections/${encodeURIComponent(collection.id)}`} className="block">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("flex size-11 items-center justify-center rounded-2xl border", colorClass)}>
              <FolderOpen className="size-5" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock3 className="size-3.5" />
              {lastUpdatedLabel}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold">{collection.name}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{collection.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{collection.itemCount} items</span>
              {typeIconComponents}
            </div>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">Open collection<ArrowUpRight className="size-4" /></span>
          </div>
        </Link>
      </div>

      <EditCollectionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        collection={{ id: collection.id, name: collection.name, description: collection.description }}
      />
    </>
  );
}
