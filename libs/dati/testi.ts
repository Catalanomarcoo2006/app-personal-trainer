// Testi calcolati dai dati: il sollecito di pagamento e gli avvisi "Urgenti" (pagamenti aperti, pacchetti in scadenza).

import { useMemo } from "react";
import { urgent, type UrgentKind } from "@/libs/prototipo/dati-finti";
import { useStato } from "@/libs/prototipo/stato";
import type { DatiClienti, Pagamento } from "./tipi";
import { vistaCliente } from "./selettori";

const euro = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 2, useGrouping: "always" });

// 4000 → "€ 40", 12050 → "€ 120,50"
export const euroDa = (cents: number) => `€ ${euro.format(cents / 100).replace(/,(\d)$/, ",$10")}`;

export function testoSollecito(p: Pagamento, nomeCliente: string): string {
  return `Ciao ${nomeCliente.split(" ")[0]}, ti ricordo il pagamento di ${euroDa(p.amountCents)} per ${p.description.toLowerCase()}. Grazie!`;
}

export type Urgente = { kind: UrgentKind; clientId: string; title: string; detail: string };

// Gli avvisi fissi della demo (seduta imminente, dolore) più quelli calcolati dai dati.
export function urgentiDa(d: DatiClienti): Urgente[] {
  const nome = (id: string) => d.clienti.find((c) => c.id === id)?.name ?? "Cliente";
  const pagamenti: Urgente[] = d.pagamenti
    .filter((p) => !p.paidOn)
    .map((p) => ({ kind: "pagamento", clientId: p.clientId, title: `Pagamento mancante · ${euroDa(p.amountCents)}`, detail: `${nome(p.clientId)} · ${p.description.toLowerCase()}` }));
  const pacchetti: Urgente[] = d.clienti.flatMap((c) => {
    const v = vistaCliente(d, c.id);
    if (!v?.pkg.expiring) return [];
    // "2 lezioni rimaste" → "restano 2 lezioni"; "Scade il 31 ottobre" → "scade il 31 ottobre"
    const [, n, cosa] = /^(\d+) (\S+)/.exec(v.pkg.left) ?? [];
    const quando = n ? `${n === "1" ? "resta" : "restano"} ${n} ${cosa}` : v.pkg.left.toLowerCase();
    return [{ kind: "pacchetto" as const, clientId: c.id, title: n ? "Pacchetto quasi finito" : "Pacchetto in scadenza", detail: `${c.name} · ${quando}` }];
  });
  const fissi = (k: UrgentKind) => urgent.filter((u) => u.kind === k);
  return [...fissi("imminente"), ...pagamenti, ...fissi("dolore"), ...pacchetti];
}

export function useUrgenti(): Urgente[] {
  const d = useStato((s) => s.dati);
  return useMemo(() => urgentiDa(d), [d]);
}
