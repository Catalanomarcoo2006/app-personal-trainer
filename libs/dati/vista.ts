// La vista dei clienti per le pagine e per Leo: dalla forma del database (tipi.ts) alla forma che le pagine
// usano da sempre (Client in dati-finti.ts). Funzioni pure, senza React né store: le usa anche il server
// (contesto di Leo). Gli hook per le pagine sono in selettori.ts.

import { isPackageExpiring } from "@/libs/domain/packages";
import { collectedCents, outstandingCents } from "@/libs/domain/payments";
import { revenue, type Client, type Payment } from "@/libs/prototipo/dati-finti";
import { conta } from "@/libs/ui/testo";
import { datiIniziali, MESI, MESI_LUNGHI, OGGI } from "./iniziali";
import { inDemo, oggi } from "@/libs/orologio";
import type { DatiClienti, Misura, Pacchetto, Pagamento } from "./tipi";

export type PagamentoVista = Payment & { id: string };
export type ClienteVista = Omit<Client, "payments"> & { payments: PagamentoVista[] };

const MESE_DEMO = OGGI.slice(0, 7); // il mese della demo (ottobre 2026)
const PESI_IN_VISTA = 8;
const CIRCONFERENZE: [keyof Misura, string][] = [
  ["waistCm", "Vita"],
  ["hipsCm", "Fianchi"],
  ["chestCm", "Petto"],
  ["armCm", "Braccio"],
  ["thighCm", "Coscia"],
];

// "2026-10-03" → "03 Ott"
export const dataBreve = (iso: string) => `${iso.slice(8, 10)} ${MESI[Number(iso.slice(5, 7)) - 1]}`;
// "2026-10-31" → "31 ottobre"
export const dataLunga = (iso: string) => `${Number(iso.slice(8, 10))} ${MESI_LUNGHI[Number(iso.slice(5, 7)) - 1]}`;

export function rimastePacchetto(p: Pacchetto): string {
  if (p.kind === "time") return p.endsOn ? `Scade il ${dataLunga(p.endsOn)}` : "Senza scadenza";
  const n = Math.max(0, (p.lessonsTotal ?? 0) - p.lessonsUsed);
  return /sedut/i.test(p.label) ? `${conta(n, "seduta rimasta", "sedute rimaste")}` : `${conta(n, "lezione rimasta", "lezioni rimaste")}`;
}

function inScadenza(p: Pacchetto): boolean {
  const fatte = Array.from({ length: p.lessonsUsed }, (_, i) => ({ id: `s${i}`, status: "done" as const }));
  return isPackageExpiring({ kind: p.kind, lessons_total: p.lessonsTotal, ends_on: p.endsOn }, fatte, new Date(`${oggi()}T12:00:00Z`));
}

const pagamentoVista = (p: Pagamento): PagamentoVista => ({ id: p.id, date: dataBreve(p.paidOn ?? p.dueOn), label: p.description, amount: p.amountCents / 100, paid: !!p.paidOn });

export function vistaCliente(d: DatiClienti, id: string): ClienteVista | undefined {
  const c = d.clienti.find((x) => x.id === id);
  if (!c) return undefined;
  // le misure in attesa del trainer non contano finché non le accetta
  const righe = d.misure.filter((m) => m.clientId === id && !m.daConfermare).sort((a, b) => a.takenOn.localeCompare(b.takenOn));
  const pesi = righe.flatMap((m) => (m.weightKg === undefined ? [] : [m.weightKg])).slice(-PESI_IN_VISTA);
  const measures = CIRCONFERENZE.flatMap(([k, label]) => {
    const conValore = righe.filter((m) => m[k] !== undefined);
    return conValore.length ? [{ label, start: conValore[0][k] as number, current: conValore[conValore.length - 1][k] as number }] : [];
  });
  const p = d.pacchetti.find((x) => x.clientId === id);
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    initials: c.initials,
    ...(c.photo ? { photo: c.photo } : {}),
    tone: c.tone,
    since: c.since,
    goal: c.goalLabel,
    unit: c.goalUnit,
    start: c.goalStart,
    current: c.goalCurrent,
    target: c.goalTarget,
    weights: pesi,
    measures,
    pkg: p ? { label: p.label, left: rimastePacchetto(p), expiring: inScadenza(p) } : { label: "Nessun pacchetto", left: "Da definire", expiring: false },
    payments: d.pagamenti.filter((x) => x.clientId === id).map(pagamentoVista),
    lastWorkout: c.lastWorkout,
    needsAttention: c.needsAttention,
    plan: c.plan,
    notes: c.notes,
    questions: c.questions,
    phone: c.phone ?? "",
    email: c.email ?? "",
  };
}

export const vistaClienti = (d: DatiClienti): ClienteVista[] => d.clienti.map((c) => vistaCliente(d, c.id)!);

// Gli incassi della demo comprendono anche movimenti che non sono tra i pagamenti dei clienti:
// la base resta fissa, i pagamenti segnati nell'app ci si aggiungono. Nella versione vera contano solo i pagamenti
// del mese di oggi.
let baseOttobre: number | undefined;
export function calcolaIncassi(d: DatiClienti): { collectedCents: number; outstandingCents: number } {
  if (!inDemo()) return { collectedCents: collectedCents(d.pagamenti, oggi().slice(0, 7)), outstandingCents: outstandingCents(d.pagamenti) };
  baseOttobre ??= revenue.collected * 100 - collectedCents(datiIniziali().pagamenti, MESE_DEMO);
  return { collectedCents: baseOttobre + collectedCents(d.pagamenti, MESE_DEMO), outstandingCents: outstandingCents(d.pagamenti) };
}
