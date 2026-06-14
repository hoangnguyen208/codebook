"use server";

import { z } from "zod";
import {
  createItem as createItemInDb,
  updateItem as updateItemInDb,
  deleteItem as deleteItemInDb,
  toggleItemFavorite as toggleItemFavoriteInDb,
  toggleItemPin as toggleItemPinInDb,
} from "@/lib/db/items";
import { getUsageLimits } from "@/lib/db/usage";
import { requireAuth } from "@/lib/action-auth";
import { validateOrFail } from "@/lib/action-validate";
import { wrapDbAction } from "@/lib/action-wrap";
import type { ActionResult } from "@/lib/action-result";

const PRO_ONLY_TYPES = new Set(["file", "image"]);

const createItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  typeName: z.string().trim().min(1, "Type is required"),
  description: z.string().trim().nullable().optional(),
  content: z.string().trim().nullable().optional(),
  url: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  language: z.string().trim().nullable().optional(),
  fileUrl: z.string().trim().nullable().optional(),
  fileName: z.string().trim().nullable().optional(),
  fileSize: z.number().int().positive().nullable().optional(),
  contentType: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  collectionIds: z.array(z.string().trim()).default([]),
});

const updateItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().nullable().optional(),
  content: z.string().trim().nullable().optional(),
  url: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  language: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim()).default([]),
  collectionIds: z.array(z.string().trim()).default([]),
});

type CreateItemInput = z.infer<typeof createItemSchema>;
type UpdateItemInput = z.infer<typeof updateItemSchema>;

async function checkUsageLimit(
  accessToken: string,
  check: (usage: Awaited<ReturnType<typeof getUsageLimits>>) => boolean,
  errorMessage: string,
): Promise<{ success: false; error: string } | null> {
  try {
    const usage = await getUsageLimits({ accessToken });
    if (!check(usage)) {
      return { success: false, error: errorMessage };
    }
  } catch {
    // If usage check fails, allow creation to proceed rather than blocking
  }
  return null;
}

export async function createItem(
  raw: CreateItemInput,
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(createItemSchema, raw);
  if ("error" in validated) return validated;

  const data = validated;

  if (PRO_ONLY_TYPES.has(data.typeName.toLowerCase()) && !authResult.isPro) {
    return { success: false, error: "File and image uploads require a Pro subscription" };
  }

  const usageError = await checkUsageLimit(
    authResult.accessToken,
    (usage) => usage.canCreateItem,
    `You have reached the free tier limit. Upgrade to Pro for unlimited items.`,
  );
  if (usageError) return usageError;

  return wrapDbAction(async () => {
    return createItemInDb(
      {
        title: data.title,
        typeName: data.typeName,
        description: data.description ?? null,
        content: data.content ?? null,
        url: data.url ? data.url : null,
        language: data.language ?? null,
        fileUrl: data.fileUrl ?? null,
        fileName: data.fileName ?? null,
        fileSize: data.fileSize ?? null,
        contentType: data.contentType ?? null,
        tags: data.tags.filter((t) => t.length > 0),
        collectionIds: data.collectionIds,
      },
      { accessToken: authResult.accessToken },
    );
  }, "Failed to create item");
}

export async function updateItem(
  itemId: string,
  raw: UpdateItemInput,
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(updateItemSchema, raw);
  if ("error" in validated) return validated;

  const data = validated;

  return wrapDbAction(async () => {
    return updateItemInDb(
      itemId,
      {
        title: data.title,
        description: data.description ?? null,
        content: data.content ?? null,
        url: data.url ? data.url : null,
        language: data.language ?? null,
        tags: data.tags.filter((t) => t.length > 0),
        collectionIds: data.collectionIds,
      },
      { accessToken: authResult.accessToken },
    );
  }, "Failed to update item");
}

export async function deleteItem(
  itemId: string,
): Promise<ActionResult<null>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  return wrapDbAction(async () => {
    await deleteItemInDb(itemId, { accessToken: authResult.accessToken });
    return null;
  }, "Failed to delete item");
}

export async function toggleFavoriteItem(
  itemId: string,
): Promise<ActionResult<boolean>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  return wrapDbAction(async () => {
    const result = await toggleItemFavoriteInDb(itemId, { accessToken: authResult.accessToken });
    return result.isFavorite;
  }, "Failed to toggle favorite");
}

export async function togglePinItem(
  itemId: string,
): Promise<ActionResult<boolean>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  return wrapDbAction(async () => {
    const result = await toggleItemPinInDb(itemId, { accessToken: authResult.accessToken });
    return result.isPinned;
  }, "Failed to toggle pin");
}
