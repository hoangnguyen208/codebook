"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getPreferencesAction, updatePreferencesAction } from "@/actions/preferences";
import type { EditorPreferences } from "@/lib/db/preferences";

const defaults: EditorPreferences = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: false,
  theme: "vs-dark",
};

type ContextType = {
  prefs: EditorPreferences;
  update: (patch: Partial<EditorPreferences>) => void;
};

const EditorPreferencesContext = createContext<ContextType>({
  prefs: defaults,
  update: () => {},
});

export function EditorPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<EditorPreferences>(defaults);

  useEffect(() => {
    getPreferencesAction()
      .then((p) => setPrefs({ ...defaults, ...p }))
      .catch(() => {});
  }, []);

  const update = useCallback((patch: Partial<EditorPreferences>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    updatePreferencesAction(next)
      .then(() => toast.success("Preferences saved"))
      .catch(() => {});
  }, [prefs]);

  return (
    <EditorPreferencesContext.Provider value={{ prefs, update }}>
      {children}
    </EditorPreferencesContext.Provider>
  );
}

export function useEditorPreferences() {
  return useContext(EditorPreferencesContext);
}
