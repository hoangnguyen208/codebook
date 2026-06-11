"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createCollection as createCollectionInDb,
  getCollectionsForSelect as getCollectionsForSelectFromDb,
  updateCollection as updateCollectionInDb,
  deleteCollection as deleteCollectionInDb,
} from "@/lib/db/collections";
import type { CollectionForSelect } from "@/types/items";

const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  description: z.string().trim().nullable().optional(),
});

type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCollection(
  raw: CreateCollectionInput,
): Promise<ActionResult<unknown>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;

  try {
    const created = await createCollectionInDb(
      {
        name: data.name,
        description: data.description ?? null,
      },
      { accessToken: session.accessToken },
    );

    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create collection",
    };
  }
}

export async function getCollectionsForSelectAction(): Promise<CollectionForSelect[]> {
  const session = await auth();
  return getCollectionsForSelectFromDb({ accessToken: session?.accessToken });
}

const updateCollectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
  description: z.string().trim().nullable().optional(),
});

type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export async function updateCollection(
  id: string,
  raw: UpdateCollectionInput,
): Promise<ActionResult<unknown>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateCollectionSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;

  try {
    const updated = await updateCollectionInDb(
      id,
      { name: data.name, description: data.description ?? null },
      { accessToken: session.accessToken },
    );
    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update collection",
    };
  }
}

export async function deleteCollection(id: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await deleteCollectionInDb(id, { accessToken: session.accessToken });
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete collection",
    };
  }
}
