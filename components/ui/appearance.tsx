"use client";

import { createContext, Fragment, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { KEY_ACCENT, KEY_THEME } from "@/libs/ui/appearance-boot";
import { conOnda } from "@/libs/ui/macchia";
import { isSoundEnabled, setSoundEnabled } from "@/libs/ui/sound";
import { registraAspetto } from "@/libs/dati/aspetto";
import { MARCHI_DEMO, MarchioDemo, usaMarchioDemo } from "@/libs/prototipo/dati-finti";

import { fumettiMarchio } from "@/components/prototipo/trainer/leo/Fumetti";

const KEY_MARCHIO = "marchio-demo";

export type Theme = "light" | "dark";

// Colori che il trainer può scegliere per il proprio marchio (con i nomi in libs/ui/colori.ts).
import { ACCENTS } from "@/libs/ui/colori";
export { ACCENTS };

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

// Versione vera: il colore del marchio è quello salvato nel database (non quello del browser, che è della demo),
// e cambiarlo lo salva lì. Lo imposta AvvioVero, prima che questo componente legga il browser.
let coloreVero: { colore: string; salva: (c: string) => void } | null = null;
export function impostaColoreVero(colore: string, salva: (c: string) => void) {
  coloreVero = { colore, salva };
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [accent, setAccentState] = useState(ACCENTS[0]);
  const [marchioPronto, setMarchioPronto] = useState(false); // cambia chiave ai figli: rileggono nome e logo del marchio demo

  useEffect(() => {
    setThemeState(document.documentElement.classList.contains("dark") ? "dark" : "light");
    if (coloreVero) {
      setAccentState(coloreVero.colore);
      document.documentElement.style.setProperty("--trainer", coloreVero.colore);
      return;
    }
    // Demo col marchio di un trainer vero (?marchio=impervida): vale per la visita (sessionStorage), non cambia la demo normale
    const chiesto = new URLSearchParams(window.location.search).get("marchio");
    if (chiesto && chiesto in MARCHI_DEMO) {
      try {
        window.sessionStorage.setItem(KEY_MARCHIO, chiesto);
      } catch {}
    }
    let marchio: string | null = null;
    try {
      marchio = window.sessionStorage.getItem(KEY_MARCHIO);
    } catch {}
    if (marchio && marchio in MARCHI_DEMO) {
      usaMarchioDemo(marchio as MarchioDemo);
      fumettiMarchio();
      setAccentState(MARCHI_DEMO[marchio as MarchioDemo].color);
      document.documentElement.style.setProperty("--trainer", MARCHI_DEMO[marchio as MarchioDemo].color);
      setMarchioPronto(true);
      return;
    }
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

      // Il nuovo tema arriva come un'onda che parte dal punto del clic e attraversa lo schermo.
      conOnda(apply, origin);
    },
    [theme],
  );

  const setAccent = useCallback((color: string) => {
    setAccentState(color);
    document.documentElement.style.setProperty("--trainer", color);
    if (coloreVero) coloreVero.salva(color);
    else write(KEY_ACCENT, color);
  }, []);

  // Leo cambia colore, tema e suoni dallo sportello (libs/dati/aspetto.ts): il ponte legge sempre i valori di adesso
  const adesso = useRef({ theme, accent, setTheme, setAccent });
  adesso.current = { theme, accent, setTheme, setAccent };
  useEffect(() => {
    registraAspetto({
      leggi: () => ({ colore: adesso.current.accent, tema: adesso.current.theme, suoni: isSoundEnabled() }),
      setAccent: (c) => adesso.current.setAccent(c),
      setTheme: (t) => adesso.current.setTheme(t),
      setSuoni: (s) => setSoundEnabled(s),
    });
    return () => registraAspetto(null);
  }, []);

  return (
    <AppearanceContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      <Fragment key={marchioPronto ? "marchio" : "base"}>{children}</Fragment>
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): Appearance {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance va usato dentro AppearanceProvider");
  return ctx;
}
