"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateItem } from "@/actions/items";
import { explainCode, optimizePrompt } from "@/actions/ai";
import type { ItemDetail } from "@/types/items";

export function useDrawerAI(
  item: ItemDetail | null,
  setItem: (item: ItemDetail) => void,
) {
  const router = useRouter();

  const handleExplainCode = async (): Promise<string | null> => {
    if (!item) return null;
    const result = await explainCode({
      code: item.content ?? "",
      language: item.language,
      typeName: item.typeName,
    });
    if (result.success) {
      return result.data;
    } else {
      toast.error(result.error);
      return null;
    }
  };

  const handleOptimizePrompt = async (): Promise<string | null> => {
    if (!item) return null;
    const result = await optimizePrompt({
      prompt: item.content ?? "",
    });
    if (result.success) {
      return result.data;
    } else {
      toast.error(result.error);
      return null;
    }
  };

  const handleApplyOptimized = async (optimizedText: string) => {
    if (!item) return;
    const result = await updateItem(item.id, {
      title: item.title,
      content: optimizedText,
      tags: item.tags,
      collectionIds: item.collectionIds ?? [],
    });
    if (result.success) {
      setItem(result.data as ItemDetail);
      toast.success("Prompt updated");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return { handleExplainCode, handleOptimizePrompt, handleApplyOptimized };
}
