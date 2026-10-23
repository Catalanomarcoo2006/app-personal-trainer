"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Quello che i passi mostrano nella vetrina: per ora l'email finta con il codice.

type Scena = {
  email: string | null;
  setEmail: (codice: string | null) => void;
};

const Contesto = createContext<Scena | null>(null);

export function ScenaProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const valore = useMemo(() => ({ email, setEmail }), [email]);
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function useScena(): Scena {
  const c = useContext(Contesto);
  if (!c) throw new Error("useScena va usato dentro ScenaProvider");
  return c;
}
