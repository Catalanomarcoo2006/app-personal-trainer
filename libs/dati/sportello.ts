// Lo sportello dei dati: l'unico punto da cui si cambiano clienti, pacchetti, pagamenti, misure e notifiche.
// Lo usano Leo, i tasti delle pagine e i test. Ogni operazione controlla (libs/domain), scrive e restituisce
// la sua inversa per "Annulla", che ricontrolla prima di rimettere le cose com'erano.
// Le funzioni sono già asincrone: con Supabase diventano chiamate al server (server action con RLS che rifà
// gli stessi controlli) e chi le usa non cambia.

import { controllaMisura } from "@/libs/domain/measurements";
import { controllaNuovoCliente, idDaNome } from "@/libs/domain/clients";
import { controllaImporto, controllaPagabile } from "@/libs/domain/payments";
import { controllaRinnovo } from "@/libs/domain/rinnovi";
import { no, OK, type Verifica } from "@/libs/domain/verifica";
import type { Tone } from "@/libs/prototipo/dati-finti";
import { stato } from "@/libs/prototipo/stato";
import { MESI, OGGI } from "./iniziali";
import type { ClienteDati, DatiClienti, Misura, Notifiche, Pacchetto, Pagamento } from "./tipi";

export type Esito = { ok: true; annulla?: () => Promise<Verifica>; id?: string } | { ok: false; motivo: string };

const MAX_MESSAGGIO = 1000;
const MAX_NOTA = 500;
const TONI: Tone[] = ["peach", "sky", "rose", "violet", "mint"];

const dati = () => stato.get().dati;
const scrivi = (fn: (d: DatiClienti) => DatiClienti) => stato.setDati(fn);
const cliente = (id: string) => dati().clienti.find((c) => c.id === id);
const nuovoId = (prefisso: string, ids: string[]) => `${prefisso}${Math.max(0, ...ids.map((x) => Number(x.slice(prefisso.length)) || 0)) + 1}`;

const cambiaCliente = (id: string, patch: Partial<ClienteDati>) => scrivi((d) => ({ ...d, clienti: d.clienti.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
const cambiaPagamento = (id: string, patch: Partial<Pagamento>) => scrivi((d) => ({ ...d, pagamenti: d.pagamenti.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
const cambiaPacchetto = (id: string, p: Pacchetto) => scrivi((d) => ({ ...d, pacchetti: d.pacchetti.map((x) => (x.id === id ? p : x)) }));

const fallito = (v: Verifica): Esito => ("motivo" in v ? { ok: false, motivo: v.motivo } : { ok: false, motivo: "Non si può fare" });

// "2026-10-31" + 1 mese → "2026-11-30": l'ultimo del mese resta l'ultimo del mese.
export function aggiungiMesi(iso: string, mesi: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fineMese = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate(); // mm 1-12
  const totale = m - 1 + mesi;
  const ny = y + Math.floor(totale / 12);
  const nm = (totale % 12) + 1;
  const giorno = d === fineMese(y, m) ? fineMese(ny, nm) : Math.min(d, fineMese(ny, nm));
  return `${ny}-${String(nm).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
}

// ——— Pagamenti e pacchetti ———

export async function segnaPagato(pagamentoId: string, oggi = OGGI): Promise<Esito> {
  const v = controllaPagabile(dati().pagamenti.find((p) => p.id === pagamentoId));
  if (!v.ok) return fallito(v);
  cambiaPagamento(pagamentoId, { paidOn: oggi });
  return {
    ok: true,
    annulla: async () => {
      const p = dati().pagamenti.find((x) => x.id === pagamentoId);
      if (!p) return no("Pagamento non trovato");
      cambiaPagamento(pagamentoId, { paidOn: null });
      return OK;
    },
  };
}

export async function registraPagamento(r: { clientId: string; amountCents: number; description: string; paidOn: string }): Promise<Esito> {
  if (!cliente(r.clientId)) return { ok: false, motivo: "Cliente non trovato" };
  const v = controllaImporto(r.amountCents);
  if (!v.ok) return fallito(v);
  if (!r.description.trim()) return { ok: false, motivo: "Manca la descrizione del pagamento" };
  const id = nuovoId("P", dati().pagamenti.map((p) => p.id));
  const nuovo: Pagamento = { id, clientId: r.clientId, packageId: null, description: r.description.trim(), amountCents: r.amountCents, dueOn: r.paidOn, paidOn: r.paidOn };
  scrivi((d) => ({ ...d, pagamenti: [...d.pagamenti, nuovo] }));
  return { ok: true, id, annulla: async () => (togliPagamento(id), OK) };
}

const togliPagamento = (id: string) => scrivi((d) => ({ ...d, pagamenti: d.pagamenti.filter((p) => p.id !== id) }));

export async function rinnovaPacchetto(r: { clientId: string; lezioni?: number; mesi?: number; amountCents: number; oggi?: string }): Promise<Esito> {
  const oggi = r.oggi ?? OGGI;
  const c = cliente(r.clientId);
  if (!c) return { ok: false, motivo: "Cliente non trovato" };
  const prima = dati().pacchetti.find((p) => p.clientId === r.clientId);
  const vr = controllaRinnovo(prima, c.name, r);
  if (!vr.ok) return fallito(vr);
  const v = controllaImporto(r.amountCents);
  if (!v.ok) return fallito(v);

  const da = prima!.endsOn && prima!.endsOn > oggi ? prima!.endsOn : oggi;
  const dopo: Pacchetto = r.lezioni !== undefined ? { ...prima!, lessonsTotal: (prima!.lessonsTotal ?? 0) + r.lezioni } : { ...prima!, endsOn: aggiungiMesi(da, r.mesi!) };

  const id = nuovoId("P", dati().pagamenti.map((p) => p.id));
  const pagamento: Pagamento = { id, clientId: c.id, packageId: prima!.id, description: `Rinnovo ${prima!.label}`, amountCents: r.amountCents, dueOn: oggi, paidOn: null };
  scrivi((d) => ({ ...d, pacchetti: d.pacchetti.map((p) => (p.id === prima!.id ? dopo : p)), pagamenti: [...d.pagamenti, pagamento] }));
  return {
    ok: true,
    id,
    annulla: async () => {
      const ora = dati().pacchetti.find((p) => p.id === prima!.id);
      if (JSON.stringify(ora) !== JSON.stringify(dopo)) return no("Il pacchetto è cambiato nel frattempo");
      if (dati().pagamenti.find((p) => p.id === id)?.paidOn) return no("Il rinnovo è già stato pagato");
      cambiaPacchetto(prima!.id, prima!);
      togliPagamento(id);
      return OK;
    },
  };
}

// ——— Misure, obiettivo, note ———

export async function aggiungiMisura(m: Omit<Misura, "id">, oggi = OGGI): Promise<Esito> {
  const c = cliente(m.clientId);
  if (!c) return { ok: false, motivo: "Cliente non trovato" };
  const v = controllaMisura(m, oggi);
  if (!v.ok) return fallito(v);
  const id = nuovoId("M", dati().misure.map((x) => x.id));
  const pesoObiettivo = m.weightKg !== undefined && c.goalUnit === "kg";
  scrivi((d) => ({
    ...d,
    misure: [...d.misure, { id, ...m }],
    clienti: pesoObiettivo ? d.clienti.map((x) => (x.id === c.id ? { ...x, goalCurrent: m.weightKg! } : x)) : d.clienti,
  }));
  return {
    ok: true,
    id,
    annulla: async () => {
      scrivi((d) => ({ ...d, misure: d.misure.filter((x) => x.id !== id) }));
      // l'avanzamento torna com'era solo se è ancora il valore scritto qui (non una misura presa dopo)
      if (pesoObiettivo && cliente(c.id)?.goalCurrent === m.weightKg) cambiaCliente(c.id, { goalCurrent: c.goalCurrent });
      return OK;
    },
  };
}

export async function aggiornaObiettivo(clientId: string, patch: { goalLabel?: string; goalTarget?: number; goalUnit?: string }): Promise<Esito> {
  const c = cliente(clientId);
  if (!c) return { ok: false, motivo: "Cliente non trovato" };
  const pulito: Partial<ClienteDati> = {};
  if (patch.goalLabel?.trim()) pulito.goalLabel = patch.goalLabel.trim();
  if (patch.goalUnit?.trim()) pulito.goalUnit = patch.goalUnit.trim();
  if (patch.goalTarget !== undefined) {
    if (!Number.isFinite(patch.goalTarget)) return { ok: false, motivo: "Il traguardo non è un numero" };
    pulito.goalTarget = patch.goalTarget;
  }
  if (!Object.keys(pulito).length) return { ok: false, motivo: "Niente da cambiare nell'obiettivo" };
  const prima = Object.fromEntries(Object.keys(pulito).map((k) => [k, c[k as keyof ClienteDati]])) as Partial<ClienteDati>;
  cambiaCliente(clientId, pulito);
  return {
    ok: true,
    annulla: async () => {
      const ora = cliente(clientId);
      if (!ora) return no("Cliente non trovato");
      if (Object.entries(pulito).some(([k, v]) => ora[k as keyof ClienteDati] !== v)) return no("L'obiettivo è cambiato nel frattempo");
      cambiaCliente(clientId, prima);
      return OK;
    },
  };
}

export async function aggiungiNota(clientId: string, testo: string, oggi = OGGI): Promise<Esito> {
  const c = cliente(clientId);
  if (!c) return { ok: false, motivo: "Cliente non trovato" };
  const t = testo.trim();
  if (!t || t.length > MAX_NOTA) return { ok: false, motivo: `La nota va da 1 a ${MAX_NOTA} caratteri` };
  const prima = c.notes;
  const dopo = `${prima}${prima ? "\n" : ""}${oggi.slice(8, 10)}/${oggi.slice(5, 7)} · ${t}`;
  cambiaCliente(clientId, { notes: dopo });
  return {
    ok: true,
    annulla: async () => {
      if (cliente(clientId)?.notes !== dopo) return no("Le note sono cambiate nel frattempo");
      cambiaCliente(clientId, { notes: prima });
      return OK;
    },
  };
}

// ——— Clienti e messaggi ———

export async function creaCliente(r: { name: string; gender: "donna" | "uomo"; email?: string; goalLabel?: string }, oggi = OGGI): Promise<Esito> {
  const elenco = dati().clienti;
  const v = controllaNuovoCliente(r.name, elenco);
  if (!v.ok) return fallito(v);
  const name = r.name.trim().replace(/\s+/g, " ");
  const id = idDaNome(name, elenco.map((c) => c.id));
  const nuovo: ClienteDati = {
    id,
    name,
    gender: r.gender,
    initials: name
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join(""),
    tone: TONI[elenco.length % TONI.length],
    since: `Dal ${oggi.slice(8, 10)} ${MESI[Number(oggi.slice(5, 7)) - 1]} ${oggi.slice(0, 4)}`,
    goalLabel: r.goalLabel?.trim() || "Da definire",
    goalUnit: "%",
    goalStart: 0,
    goalCurrent: 0,
    goalTarget: 100,
    notes: "",
    lastWorkout: "Mai",
    needsAttention: false,
    plan: "Da preparare",
    questions: [],
    ...(r.email?.trim() ? { email: r.email.trim() } : {}),
  };
  scrivi((d) => ({ ...d, clienti: [...d.clienti, nuovo] }));
  return {
    ok: true,
    id,
    annulla: async () => {
      scrivi((d) => ({
        ...d,
        clienti: d.clienti.filter((c) => c.id !== id),
        misure: d.misure.filter((m) => m.clientId !== id),
        pagamenti: d.pagamenti.filter((p) => p.clientId !== id),
        pacchetti: d.pacchetti.filter((p) => p.clientId !== id),
      }));
      return OK;
    },
  };
}

export async function inviaMessaggio(clientId: string, testo: string): Promise<Esito> {
  if (!cliente(clientId)) return { ok: false, motivo: "Cliente non trovato" };
  const t = testo.trim();
  if (!t || t.length > MAX_MESSAGGIO) return { ok: false, motivo: "Il messaggio è vuoto o troppo lungo" };
  stato.addMessage(clientId, { from: "trainer", text: t, time: "Adesso" });
  return { ok: true };
}

// ——— Impostazioni ———

export async function impostaNotifica(tipo: keyof Notifiche, attiva: boolean): Promise<Esito> {
  if (!(tipo in dati().notifiche)) return { ok: false, motivo: "Notifica non trovata" };
  const prima = dati().notifiche[tipo];
  scrivi((d) => ({ ...d, notifiche: { ...d.notifiche, [tipo]: attiva } }));
  return {
    ok: true,
    annulla: async () => {
      scrivi((d) => ({ ...d, notifiche: { ...d.notifiche, [tipo]: prima } }));
      return OK;
    },
  };
}
