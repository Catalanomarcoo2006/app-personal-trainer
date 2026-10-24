"use client";

import { createContext, ReactNode, useMemo, useState, useContext } from "react";

// Quello che i passi mostrano nella vetrina: l'email finta con il codice (Accesso) e la casella degli accordi
// (Accordi), che spunta anche il consenso sul telefono d'anteprima; il nome del primo cliente mentre si scrive
// e l'invito partito (PrimoCliente), che il telefono mostra come l'invito ricevuto dal cliente; nel passo di Leo
// (ConosciLeo) se si è arrivati alla scelta del tono: allora Leo si fa da parte ed entra il telefono con la chat.

type Scena = {
  email: string | null;
  setEmail: (codice: string | null) => void;
  consenso: boolean;
  setConsenso: (si: boolean) => void;
  invito: Invito;
  setInvito: (i: Invito) => void;
  sceltaTono: boolean;
  setSceltaTono: (si: boolean) => void;
};

export type Invito = { nome: string; inviato: boolean };

const Contesto = createContext<Scena | null>(null);

export function ScenaProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [consenso, setConsenso] = useState(false);
  const [invito, setInvito] = useState<Invito>({ nome: "", inviato: false });
  const [sceltaTono, setSceltaTono] = useState(false);
  const valore = useMemo(
    () => ({ email, setEmail, consenso, setConsenso, invito, setInvito, sceltaTono, setSceltaTono }),
    [email, consenso, invito, sceltaTono],
  );
  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>;
}

export function useScena(): Scena {
  const c = useContext(Contesto);
  if (!c) throw new Error("useScena va usato dentro ScenaProvider");
  return c;
}
