"use server";

import { auth } from "@/auth";
import {
  getPreferences as getPreferencesFromDb,
  updatePreferences as updatePreferencesInDb,
} from "@/lib/db/preferences";
import type { EditorPreferences } from "@/lib/db/preferences";

export async function getPreferencesAction(): Promise<EditorPreferences> {
  const session = await auth();
  return getPreferencesFromDb({ accessToken: session?.accessToken });
}

export async function updatePreferencesAction(
  prefs: EditorPreferences,
): Promise<EditorPreferences> {
  const session = await auth();
  return updatePreferencesInDb(prefs, { accessToken: session?.accessToken });
}
