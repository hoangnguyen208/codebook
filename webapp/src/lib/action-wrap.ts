import "server-only";

import type { ActionResult } from "./action-result";

export async function wrapDbAction<T>(
  fn: () => Promise<T>,
  fallbackMessage: string,
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : fallbackMessage,
    };
  }
}
