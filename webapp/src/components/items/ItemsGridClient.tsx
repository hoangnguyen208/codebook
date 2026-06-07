"use client";

import { ItemCard } from "@/components/items/ItemCard";
import { ItemDrawerProvider, useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import type { DashboardItem, DashboardItemType } from "@/types/items";

type ItemsGridClientProps = {
  items: DashboardItem[];
  itemTypeIconName: DashboardItemType["icon"];
  itemTypeColorClasses: string;
  itemTypeBorderColorClass: string;
  itemTypeLabel: string;
};

function ItemsGridInner({
  items,
  itemTypeIconName,
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
              iconName: itemTypeIconName,
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
