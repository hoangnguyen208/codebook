import "server-only";

import { auth } from "@/auth";
import type { ActionResult, Fail } from "./action-result";

type AuthSession = {
  accessToken: string;
  userId: string;
  isPro: boolean;
};

export async function requireAuth(): Promise<AuthSession | Fail> {
  const session = await auth();

  if (!session?.user?.id || !session?.accessToken) {
    return { success: false, error: "Not authenticated" };
  }

  return {
    accessToken: session.accessToken,
    userId: session.user.id,
    isPro: Boolean(session.user.isPro),
  };
}

export async function requireProAuth(
  featureName: string,
): Promise<AuthSession | Fail> {
  const result = await requireAuth();

  if ("error" in result) {
    return result;
  }

  if (!result.isPro) {
    return {
      success: false,
      error: `${featureName} is a Pro feature`,
    };
  }

  return result;
}
