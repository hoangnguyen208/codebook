"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type ItemDrawerContextValue = {
  selectedItemId: string | null;
  openDrawer: (itemId: string) => void;
  closeDrawer: () => void;
  isOpen: boolean;
};

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

export function useItemDrawer() {
  const ctx = useContext(ItemDrawerContext);
  if (!ctx) {
    throw new Error("useItemDrawer must be used within ItemDrawerProvider");
  }
  return ctx;
}

type ItemDrawerProviderProps = {
  children: ReactNode;
  selectedItemId?: string | null;
  onOpenChange?: (itemId: string | null) => void;
};

export function ItemDrawerProvider({
  children,
  selectedItemId: controlledSelectedItemId,
  onOpenChange,
}: ItemDrawerProviderProps) {
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(null);

  const isControlled = controlledSelectedItemId !== undefined;
  const selectedItemId = isControlled ? controlledSelectedItemId : internalSelectedItemId;

  const openDrawer = useCallback(
    (itemId: string) => {
      if (isControlled) {
        onOpenChange?.(itemId);
      } else {
        setInternalSelectedItemId(itemId);
      }
    },
    [isControlled, onOpenChange],
  );

  const closeDrawer = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(null);
    } else {
      setInternalSelectedItemId(null);
    }
  }, [isControlled, onOpenChange]);

  const value = useMemo<ItemDrawerContextValue>(
    () => ({
      selectedItemId,
      openDrawer,
      closeDrawer,
      isOpen: selectedItemId !== null,
    }),
    [selectedItemId, openDrawer, closeDrawer],
  );

  return (
    <ItemDrawerContext.Provider value={value}>
      {children}
    </ItemDrawerContext.Provider>
  );
}
