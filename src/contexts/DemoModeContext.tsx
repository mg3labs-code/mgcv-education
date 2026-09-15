import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "mgcv:teacher-demo-mode";

type DemoModeContextValue = {
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
};

const DemoModeContext = createContext<DemoModeContextValue | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoModeState] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const value = useMemo<DemoModeContextValue>(() => ({
    demoMode,
    setDemoMode: (enabled) => {
      setDemoModeState(enabled);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
      }
    },
  }), [demoMode]);

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const context = useContext(DemoModeContext);
  if (!context) throw new Error("useDemoMode must be used within DemoModeProvider");
  return context;
}