"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { KEY_ACCENT, KEY_THEME } from "@/libs/ui/appearance-boot";

export type Theme = "light" | "dark";

// Colori che il trainer può scegliere per il proprio marchio.
export const ACCENTS = ["#ff6b2c", "#e5484d", "#d6409f", "#6a5ae0", "#2f7dac", "#0f9d8a", "#2f9a68", "#da9f4a"];

type Appearance = {
  theme: Theme;
  setTheme: (theme: Theme, origin?: { x: number; y: number }) => void;
  accent: string;
  setAccent: (color: string) => void;
};

const AppearanceContext = createContext<Appearance | null>(null);


function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // navigazione privata: la scelta vale per questa visita
  }
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState(ACCENTS[0]);

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const saved = read(KEY_ACCENT);
    if (saved) setAccentState(saved);
  }, []);

  const setTheme = useCallback(
    (next: Theme, origin?: { x: number; y: number }) => {
      if (next === theme) return;
      const apply = () => {
        flushSync(() => setThemeState(next));
        document.documentElement.classList.toggle("dark", next === "dark");
        write(KEY_THEME, next);
      };

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!document.startViewTransition || reduce) {
        apply();
        return;
      }

      // Il nuovo tema si allarga come una macchia dal punto del clic fino a coprire lo schermo.
      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? window.innerHeight / 2;
      const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const end = reach * 3.2; // la macchia non è un cerchio: serve margine per coprire gli angoli
      const transition = document.startViewTransition(apply);
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            maskSize: ["0px 0px", `${end * 0.18}px ${end * 0.18}px`, `${end}px ${end}px`],
            maskPosition: [`${x}px ${y}px`, `${x - end * 0.09}px ${y - end * 0.09}px`, `${x - end / 2}px ${y - end / 2}px`],
          },
          { duration: 900, easing: "cubic-bezier(0.7, 0, 0.3, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      });
    },
    [theme],
  );

  const setAccent = useCallback((color: string) => {
    setAccentState(color);
    document.documentElement.style.setProperty("--trainer", color);
    write(KEY_ACCENT, color);
  }, []);

  return <AppearanceContext.Provider value={{ theme, setTheme, accent, setAccent }}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): Appearance {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance va usato dentro AppearanceProvider");
  return ctx;
}
