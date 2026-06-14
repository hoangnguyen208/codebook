import "server-only";

import type { z } from "zod";
import type { Fail } from "./action-result";

export function validateOrFail<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): T | Fail {
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Validation failed",
    };
  }

  return parsed.data;
}
