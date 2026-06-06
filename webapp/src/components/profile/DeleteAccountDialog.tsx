"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/actions/profile";

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      await deleteAccountAction();
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-xl bg-destructive/10 px-4 text-sm font-medium text-destructive hover:bg-destructive/20 transition-colors"
      >
        Delete account
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !isPending && setIsOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">Delete account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This action is permanent and cannot be undone. All your data, collections, and items will be lost.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
