"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionInDb,
  getCollectionsForSelect as getCollectionsForSelectFromDb,
  updateCollection as updateCollectionInDb,
  deleteCollection as deleteCollectionInDb,
  toggleCollectionFavorite as toggleCollectionFavoriteInDb,
} from "@/lib/db/collections";
import { getUsageLimits } from "@/lib/db/usage";
import { requireAuth } from "@/lib/action-auth";
import { validateOrFail } from "@/lib/action-validate";
import { wrapDbAction } from "@/lib/action-wrap";
import type { ActionResult } from "@/lib/action-result";
import type { CollectionForSelect } from "@/types/items";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  description: z.string().trim().nullable().optional(),
});

type CollectionInput = z.infer<typeof collectionSchema>;

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

export async function createCollection(
  raw: CollectionInput,
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(collectionSchema, raw);
  if ("error" in validated) return validated;

  const data = validated;

  const usageError = await checkUsageLimit(
    authResult.accessToken,
    (usage) => usage.canCreateCollection,
    `You have reached the free tier limit. Upgrade to Pro for unlimited collections.`,
  );
  if (usageError) return usageError;

  return wrapDbAction(async () => {
    return createCollectionInDb(
      { name: data.name, description: data.description ?? null },
      { accessToken: authResult.accessToken },
    );
  }, "Failed to create collection");
}

export async function getCollectionsForSelectAction(): Promise<CollectionForSelect[]> {
  const session = await auth();
  return getCollectionsForSelectFromDb({ accessToken: session?.accessToken });
}

export async function updateCollection(
  id: string,
  raw: CollectionInput,
): Promise<ActionResult<unknown>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  const validated = validateOrFail(collectionSchema, raw);
  if ("error" in validated) return validated;

  const data = validated;

  return wrapDbAction(async () => {
    return updateCollectionInDb(
      id,
      { name: data.name, description: data.description ?? null },
      { accessToken: authResult.accessToken },
    );
  }, "Failed to update collection");
}

export async function deleteCollection(id: string): Promise<ActionResult<null>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  return wrapDbAction(async () => {
    await deleteCollectionInDb(id, { accessToken: authResult.accessToken });
    return null;
  }, "Failed to delete collection");
}

export async function toggleFavoriteCollection(
  collectionId: string,
): Promise<ActionResult<boolean>> {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult;

  return wrapDbAction(async () => {
    const result = await toggleCollectionFavoriteInDb(collectionId, { accessToken: authResult.accessToken });
    return result.isFavorite;
  }, "Failed to toggle favorite");
}
