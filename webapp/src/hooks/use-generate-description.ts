"use client";

import { useState } from "react";
import { toast } from "sonner";
import { generateDescription } from "@/actions/ai";

export function useGenerateDescription(
  title: string,
  content: string,
  typeName: string,
  language: string,
  url: string,
  onSuccess: (description: string) => void,
) {
  const [loadingDescription, setLoadingDescription] = useState(false);

  const handleGenerateDescription = async () => {
    setLoadingDescription(true);
    const result = await generateDescription({
      title: title.trim() || null,
      content: content.trim() || null,
      typeName: typeName || null,
      language: language.trim() || null,
      url: url.trim() || null,
    });
    setLoadingDescription(false);
    if (result.success) {
      onSuccess(result.data);
    } else {
      toast.error(result.error);
    }
  };

  return { loadingDescription, handleGenerateDescription };
}
