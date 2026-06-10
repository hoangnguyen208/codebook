"use server";

import { z } from "zod";
import { auth } from "@/auth";
import {
  createItem as createItemInDb,
  updateItem as updateItemInDb,
  deleteItem as deleteItemInDb,
} from "@/lib/db/items";

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

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createItem(
  raw: CreateItemInput,
): Promise<ActionResult<unknown>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = createItemSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;

  try {
    const created = await createItemInDb(
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
      { accessToken: session.accessToken },
    );

    return { success: true, data: created };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create item",
    };
  }
}

export async function updateItem(
  itemId: string,
  raw: UpdateItemInput,
): Promise<ActionResult<unknown>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  const parsed = updateItemSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Validation failed";
    return { success: false, error: firstIssue };
  }

  const data = parsed.data;

  try {
    const updated = await updateItemInDb(
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
      { accessToken: session.accessToken },
    );

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

export async function deleteItem(
  itemId: string,
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    await deleteItemInDb(itemId, { accessToken: session.accessToken });
    return { success: true, data: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}
