"use server";

import { auth } from "@/auth";
import {
  getPreferences as getPreferencesFromDb,
  updatePreferences as updatePreferencesInDb,
} from "@/lib/db/preferences";
import type { EditorPreferences } from "@/lib/db/preferences";

export async function getPreferencesAction(): Promise<EditorPreferences> {
  const session = await auth();
  if (!session?.accessToken) {
    return {
      fontSize: 14,
      tabSize: 2,
      theme: "vs-dark",
      wordWrap: true,
      minimap: false,
    };
  }
  return getPreferencesFromDb({ accessToken: session.accessToken });
}

export async function updatePreferencesAction(
  prefs: EditorPreferences,
): Promise<EditorPreferences> {
  const session = await auth();
  if (!session?.accessToken) {
    return prefs;
  }
  return updatePreferencesInDb(prefs, { accessToken: session.accessToken });
}
