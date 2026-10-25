// Lettura dei dati dei clienti per le pagine (hook React) e per Leo nel browser (situazione di adesso).
// La trasformazione vera è in vista.ts (pura, usata anche dal server). Con Supabase questi selettori
// leggeranno dalle tabelle; chi li usa resta uguale.

import { useMemo } from "react";
import { stato, useStato } from "@/libs/prototipo/stato";
import { calcolaIncassi, vistaCliente, vistaClienti, type ClienteVista } from "./vista";
import { urgentiDa, type Urgente } from "./testi";
import type { Notifiche, Pagamento } from "./tipi";

export * from "./vista";

// ——— Hook per le pagine ———

const useDati = () => useStato((s) => s.dati);

export function useClienti(): ClienteVista[] {
  const d = useDati();
  return useMemo(() => vistaClienti(d), [d]);
}

export function useCliente(id: string): ClienteVista | undefined {
  const d = useDati();
  return useMemo(() => vistaCliente(d, id), [d, id]);
}

export const usePagamenti = (): Pagamento[] => useStato((s) => s.dati.pagamenti);
export const useNotifiche = (): Notifiche => useStato((s) => s.dati.notifiche);

export function useIncassi() {
  const d = useDati();
  return useMemo(() => calcolaIncassi(d), [d]);
}

// Fuori da React (Leo, i controlli): la situazione di adesso.
export const clientiAttuali = (): ClienteVista[] => vistaClienti(stato.get().dati);
export const clienteAttuale = (id: string): ClienteVista | undefined => vistaCliente(stato.get().dati, id);

// Per le pagine che cercano un cliente per id (nome, foto): segue anche i clienti creati nell'app.
export function useTrovaCliente(): (id: string) => ClienteVista | undefined {
  const clienti = useClienti();
  return useMemo(() => {
    const perId = new Map(clienti.map((c) => [c.id, c]));
    return (id: string) => perId.get(id);
  }, [clienti]);
}

export function useUrgenti(): Urgente[] {
  const d = useDati();
  return useMemo(() => urgentiDa(d), [d]);
}
