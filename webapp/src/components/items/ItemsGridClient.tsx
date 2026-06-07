"use client";

import type { LucideIcon } from "lucide-react";

import { ItemCard } from "@/components/items/ItemCard";
import { ItemDrawerProvider, useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import type { DashboardItem } from "@/lib/db/items";

type ItemsGridClientProps = {
  items: DashboardItem[];
  itemTypeIcon: LucideIcon;
  itemTypeColorClasses: string;
  itemTypeBorderColorClass: string;
  itemTypeLabel: string;
};

function ItemsGridInner({
  items,
  itemTypeIcon,
  itemTypeColorClasses,
  itemTypeBorderColorClass,
  itemTypeLabel,
}: ItemsGridClientProps) {
  const { openDrawer } = useItemDrawer();

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            itemType={{
              label: itemTypeLabel,
              icon: itemTypeIcon,
              colorClasses: itemTypeColorClasses,
              borderColorClass: itemTypeBorderColorClass,
            }}
            onClick={openDrawer}
          />
        ))}
      </div>
      <ItemDrawerSheet />
    </>
  );
}

export function ItemsGridClient(props: ItemsGridClientProps) {
  return (
    <ItemDrawerProvider>
      <ItemsGridInner {...props} />
    </ItemDrawerProvider>
  );
}
