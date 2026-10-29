"use client";

// Messaggi non letti del trainer da telefono: per ogni conversazione, i messaggi del cliente arrivati dopo l'ultima
// volta che il trainer l'ha aperta. All'inizio valgono i non letti della demo (conversations[].unread); un messaggio
// nuovo del cliente (anche dalla sua app, in un'altra finestra) li fa salire. Con Supabase sarà una colonna "letto".

import { useMemo, useSyncExternalStore } from "react";
import { conversations, type ChatMessage } from "@/libs/prototipo/dati-finti";
import { useStato } from "@/libs/prototipo/stato";

type Thread = Record<string, ChatMessage[]>;

let visti: Record<string, number> | null = null; // messaggi del cliente già visti, per conversazione
const chi = new Set<() => void>();
const iscrivi = (f: () => void) => {
  chi.add(f);
  return () => {
    chi.delete(f);
  };
};

const delCliente = (m: ChatMessage[] = []) => m.filter((x) => x.from === "client").length;

function vistiDa(threads: Thread): Record<string, number> {
  visti ??= Object.fromEntries(Object.entries(threads).map(([id, m]) => [id, delCliente(m) - (conversations.find((c) => c.clientId === id)?.unread ?? 0)]));
  return visti;
}

export function segnaLetta(id: string, threads: Thread) {
  const v = vistiDa(threads);
  const n = delCliente(threads[id]);
  if (v[id] === n) return;
  visti = { ...v, [id]: n };
  chi.forEach((f) => f());
}

export function useNonLetti(): Record<string, number> {
  const threads = useStato((s) => s.threads);
  const v = useSyncExternalStore(
    iscrivi,
    () => visti,
    () => visti,
  );
  return useMemo(() => {
    const base = v ?? vistiDa(threads);
    return Object.fromEntries(Object.entries(threads).map(([id, m]) => [id, Math.max(0, delCliente(m) - (base[id] ?? 0))]));
  }, [threads, v]);
}
