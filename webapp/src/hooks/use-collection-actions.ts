"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCollection, toggleFavoriteCollection } from "@/actions/collections";

export function useCollectionActions(collectionId: string, initialFavorite: boolean) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteCollection(collectionId);
    setDeleting(false);
    if (result.success) {
      toast.success("Collection deleted");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleFavorite = async () => {
    setFavoriteLoading(true);
    const result = await toggleFavoriteCollection(collectionId);
    if (result.success === true) {
      setIsFavorite(result.data);
    }
    setFavoriteLoading(false);
  };

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleting,
    favoriteLoading,
    isFavorite,
    handleDelete,
    handleFavorite,
  };
}
