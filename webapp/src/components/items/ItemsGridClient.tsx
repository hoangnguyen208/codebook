"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { ItemCard } from "@/components/items/ItemCard";
import { ImageCard } from "@/components/items/ImageCard";
import { FileRow } from "@/components/items/FileRow";
import { ItemDrawerProvider, useItemDrawer } from "@/components/items/ItemDrawerProvider";
import { ItemDrawerSheet } from "@/components/items/ItemDrawerSheet";
import { CreateItemDialog } from "@/components/items/CreateItemDialog";
import { Button } from "@/components/ui/button";
import type { DashboardItem, DashboardItemType } from "@/types/items";

type ItemsGridClientProps = {
  items: DashboardItem[];
  itemTypeIconName: DashboardItemType["icon"];
  itemTypeColorClasses: string;
  itemTypeBorderColorClass: string;
  itemTypeLabel: string;
  typeName: string;
  initialCollectionId?: string;
};

function ItemsGridInner({
  items,
  itemTypeIconName,
  itemTypeColorClasses,
  itemTypeBorderColorClass,
  itemTypeLabel,
  typeName,
  initialCollectionId,
}: ItemsGridClientProps) {
  const { openDrawer } = useItemDrawer();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isImageType = typeName === "image";
  const isFileType = typeName === "file";
  const gridCols = isImageType ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          size="lg"
          className="h-11 rounded-2xl px-4"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="size-4" />
          New {itemTypeLabel}
        </Button>
      </div>

      {items.length === 0 ? (
        <section className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-muted-foreground">
            No {itemTypeLabel.toLowerCase()}s yet
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first {itemTypeLabel.toLowerCase()} to get started.
          </p>
        </section>
      ) : isFileType ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <FileRow
              key={item.id}
              item={item}
              onClick={openDrawer}
            />
          ))}
        </div>
      ) : (
        <div className={`grid gap-4 ${gridCols}`}>
          {items.map((item) =>
            isImageType ? (
              <ImageCard
                key={item.id}
                item={item}
                onClick={openDrawer}
              />
            ) : (
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
            ),
          )}
        </div>
      )}

      <ItemDrawerSheet />
      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialType={typeName}
        initialCollectionId={initialCollectionId}
      />
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
