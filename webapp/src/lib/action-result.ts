import "server-only";

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Fail = { success: false; error: string };
