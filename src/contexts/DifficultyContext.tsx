import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type DifficultyMode = "explorer" | "builder" | "master";

const STORAGE_KEY = "difficulty_mode";
const DB_TO_MODE: Record<string, DifficultyMode> = {
  easy: "explorer",
  medium: "builder",
  hard: "master",
};
const MODE_TO_DB: Record<DifficultyMode, string> = {
  explorer: "easy",
  builder: "medium",
  master: "hard",
};

interface DifficultyContextValue {
  mode: DifficultyMode;
  setMode: (mode: DifficultyMode) => void;
  hasInteracted: boolean;
  markInteracted: () => void;
}

const DifficultyContext = createContext<DifficultyContextValue | null>(null);

export const DifficultyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [mode, setModeState] = useState<DifficultyMode>("builder");
  const [hasInteracted, setHasInteracted] = useState(false);

  // Hydrate from localStorage immediately, then DB
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached === "explorer" || cached === "builder" || cached === "master") {
      setModeState(cached);
    }

    if (!user) return;
    supabase
      .from("student_preferences")
      .select("difficulty_level")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const dbMode = data?.difficulty_level && DB_TO_MODE[data.difficulty_level];
        if (dbMode) {
          setModeState(dbMode);
          localStorage.setItem(STORAGE_KEY, dbMode);
        }
      });
  }, [user]);

  const setMode = useCallback(
    (next: DifficultyMode) => {
      setModeState(next);
      setHasInteracted(true);
      localStorage.setItem(STORAGE_KEY, next);
      if (user) {
        supabase
          .from("student_preferences")
          .upsert(
            { user_id: user.id, difficulty_level: MODE_TO_DB[next] },
            { onConflict: "user_id" }
          )
          .then(({ error }) => {
            if (error) console.error("[Difficulty] persist failed", error);
          });
      }
    },
    [user]
  );

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  return (
    <DifficultyContext.Provider value={{ mode, setMode, hasInteracted, markInteracted }}>
      {children}
    </DifficultyContext.Provider>
  );
};

export const useDifficulty = () => {
  const ctx = useContext(DifficultyContext);
  if (!ctx) throw new Error("useDifficulty must be used inside DifficultyProvider");
  return ctx;
};
