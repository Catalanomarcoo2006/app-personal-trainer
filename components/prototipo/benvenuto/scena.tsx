"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Quello che i passi mostrano nella vetrina: l'email finta con il codice e Leo (esce dalla pallina, poi resta fermo).

export type FaseLeo = "nessuno" | "esce" | "fermo";

type Scena = {
  email: string | null;
  setEmail: (codice: string | null) => void;
  leo: FaseLeo;
  setLeo: (f: FaseLeo) => void;
};

const Contesto = createContext<Scena | null>(null);

export function ScenaProvider({ leoIniziale, children }: { leoIniziale: FaseLeo; children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [leo, setLeo] = useState<FaseLeo>(leoIniziale);
  const valore = useMemo(() => ({ email, setEmail, leo, setLeo }), [email, leo]);
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function useScena(): Scena {
  const c = useContext(Contesto);
  if (!c) throw new Error("useScena va usato dentro ScenaProvider");
  return c;
}
