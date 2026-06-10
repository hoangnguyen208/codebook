"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCollection } from "@/actions/collections";

const inputClasses =
  "w-full rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateCollectionDialog({ open, onOpenChange }: Props) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setDescription("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const result = await createCollection({
      name: name.trim(),
      description: description.trim() || null,
    });

    setSaving(false);

    if (result.success) {
      toast.success("Collection created");
      router.refresh();
      handleOpenChange(false);
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  const disableSave = !name.trim() || saving;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>New collection</DialogTitle>
        <DialogDescription>
          Create a new collection to organize your items.
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
            placeholder="Collection name (required)"
            aria-label="Collection name"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClasses}
            placeholder="Description (optional)"
            aria-label="Description"
            rows={3}
          />

          {error ? (
            <p className="rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X className="size-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={disableSave}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Plus className="size-4" />
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
