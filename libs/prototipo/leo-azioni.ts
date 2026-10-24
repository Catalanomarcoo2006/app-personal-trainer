// Le azioni di Leo: il menu che l'AI riceve (tool calling), gli schemi per controllarne la forma
// e i controlli dell'app prima di eseguirle. Logica pura: la usano la rotta, il browser e i test.
// Con Supabase gli stessi schemi e controlli passeranno lato server.

import { z } from "zod";
import { clientById, trainer, type Appointment, type AppointmentType } from "./dati-finti";
import { clienteDaCodice, codiceDi, pseudonimizza, ripristinaNomi } from "./leo-contesto";

// Una seduta del calendario con id stabile (A1, A2, …) e data vera.
export type Seduta = Appointment & { id: string; date: string }; // date "AAAA-MM-GG"

export type AzioneLeo =
  | { nome: "fissa_appuntamento"; dati: { cliente: string; data: string; ora: string; durata: number; tipo: AppointmentType; luogo?: string } }
  | { nome: "sposta_appuntamento"; dati: { id: string; data: string; ora: string; durata?: number } }
  | { nome: "cancella_appuntamento"; dati: { id: string } }
  | { nome: "scrivi_messaggio"; dati: { cliente: string; testo: string } };

export const MAX_AZIONI = 5;
export const TIPI: AppointmentType[] = ["Workout", "Valutazione", "Online", "Corsa"];

// La demo è ferma a mercoledì 21 ottobre 2026; Leo agisce su questa settimana (19–25) e sulla prossima.
export const ADESSO = { data: "2026-10-21", ora: trainer.now } as const;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const GIORNI_LEO: string[] = Array.from({ length: 14 }, (_, i) => iso(new Date(2026, 9, 19 + i)));

const ORA_INIZIO = 6 * 60;
const ORA_FINE = 22 * 60;
const DURATA = { min: 15, max: 180 };
const MAX_TESTO = 1000;

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// "9:00" → "09:00", "18.30" → "18:30"; null se non è un'ora valida.
export function normalizzaOra(s: string): string | null {
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

// ——— Forma delle azioni ———

const Ora = z.preprocess((v) => (typeof v === "string" ? (normalizzaOra(v) ?? v) : v), z.string().regex(/^\d{2}:\d{2}$/));
const Data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Durata = z.coerce.number().int();

const Schemi = {
  fissa_appuntamento: z.object({
    cliente: z.string().min(1),
    data: Data,
    ora: Ora,
    durata: Durata,
    tipo: z.enum(["Workout", "Valutazione", "Online", "Corsa"]),
    luogo: z.string().min(1).max(80).optional(),
  }),
  sposta_appuntamento: z.object({ id: z.string().min(1), data: Data, ora: Ora, durata: Durata.optional() }),
  cancella_appuntamento: z.object({ id: z.string().min(1) }),
  scrivi_messaggio: z.object({ cliente: z.string().min(1), testo: z.string().trim().min(1).max(MAX_TESTO) }),
};

// Il nome e gli argomenti arrivati dall'AI diventano un'azione, oppure null se la forma è sbagliata.
export function leggiAzione(nome: string, argomenti: unknown): AzioneLeo | null {
  if (!(nome in Schemi)) return null;
  const r = Schemi[nome as keyof typeof Schemi].safeParse(argomenti);
  return r.success ? ({ nome, dati: r.data } as AzioneLeo) : null;
}

// Dai codici dell'AI ai dati veri: cliente "C3" → id, nomi rimessi nel testo. null se il cliente non esiste.
export function inChiaro(a: AzioneLeo): AzioneLeo | null {
  if (a.nome === "fissa_appuntamento" || a.nome === "scrivi_messaggio") {
    const cliente = clienteDaCodice(a.dati.cliente);
    if (!cliente) return null;
    if (a.nome === "scrivi_messaggio") return { nome: a.nome, dati: { cliente, testo: ripristinaNomi(a.dati.testo) } };
    return { nome: a.nome, dati: { ...a.dati, cliente } };
  }
  return a;
}

// ——— Controlli dell'app ———

export type Verifica = { ok: true } | { ok: false; motivo: string };
const no = (motivo: string): Verifica => ({ ok: false, motivo });
const nomeDi = (id: string) => clientById(id)?.name ?? "un altro cliente";

function controllaOrario(data: string, ora: string, durata: number, sedute: Seduta[], adesso: { data: string; ora: string }, esclusa?: string): Verifica {
  if (!GIORNI_LEO.includes(data)) return no("Posso agire solo su questa settimana e sulla prossima");
  const inizio = toMinutes(ora);
  if (data < adesso.data || (data === adesso.data && inizio < toMinutes(adesso.ora))) return no("Quell'orario è già passato");
  if (durata < DURATA.min || durata > DURATA.max) return no(`La durata va da ${DURATA.min} a ${DURATA.max} minuti`);
  if (inizio < ORA_INIZIO) return no("Le sedute iniziano dalle 6:00");
  if (inizio + durata > ORA_FINE) return no("Le sedute finiscono entro le 22:00");
  const scontro = sedute.find((s) => s.id !== esclusa && s.date === data && inizio < toMinutes(s.time) + s.minutes && toMinutes(s.time) < inizio + durata);
  if (scontro) return no(`Si sovrappone con ${nomeDi(scontro.clientId)} alle ${scontro.time}`);
  return { ok: true };
}

// a è già in chiaro (inChiaro): i clienti sono id, non codici.
export function verificaAzione(a: AzioneLeo, sedute: Seduta[], adesso: { data: string; ora: string } = ADESSO): Verifica {
  switch (a.nome) {
    case "fissa_appuntamento":
      if (!clientById(a.dati.cliente)) return no("Cliente non trovato");
      return controllaOrario(a.dati.data, a.dati.ora, a.dati.durata, sedute, adesso);
    case "sposta_appuntamento": {
      const s = sedute.find((x) => x.id === a.dati.id);
      if (!s) return no("Appuntamento non trovato");
      return controllaOrario(a.dati.data, a.dati.ora, a.dati.durata ?? s.minutes, sedute, adesso, s.id);
    }
    case "cancella_appuntamento":
      return sedute.some((x) => x.id === a.dati.id) ? { ok: true } : no("Appuntamento non trovato");
    case "scrivi_messaggio":
      if (!clientById(a.dati.cliente)) return no("Cliente non trovato");
      return a.dati.testo.trim() && a.dati.testo.length <= MAX_TESTO ? { ok: true } : no("Il messaggio è vuoto o troppo lungo");
  }
}

// Cancellare e scrivere al cliente solo dopo il tocco del trainer; fissare e spostare subito, con "Annulla".
export const daConfermare = (a: AzioneLeo) => a.nome === "cancella_appuntamento" || a.nome === "scrivi_messaggio";

export function luogoPredefinito(tipo: AppointmentType): string {
  return tipo === "Online" ? "Videochiamata" : tipo === "Corsa" ? "Parco di Meolo" : "Fit Lab, Meolo";
}

// ——— Testi ———

const GIORNI_BREVI = ["dom", "lun", "mar", "mer", "gio", "ven", "sab"];
export function quando(data: string, ora: string): string {
  const [y, m, d] = data.split("-").map(Number);
  return `${GIORNI_BREVI[new Date(y, m - 1, d).getDay()]} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")} ${ora}`;
}

// Il titolo della scheda dell'azione nella chat, con i nomi veri. a è in chiaro.
export function riassunto(a: AzioneLeo, sedute: Seduta[]): string {
  switch (a.nome) {
    case "fissa_appuntamento":
      return `Fisso ${a.dati.tipo} con ${nomeDi(a.dati.cliente)} · ${quando(a.dati.data, a.dati.ora)} · ${a.dati.durata} min`;
    case "sposta_appuntamento": {
      const s = sedute.find((x) => x.id === a.dati.id);
      const dopo = quando(a.dati.data, a.dati.ora);
      return s ? `Sposto ${nomeDi(s.clientId)} · ${quando(s.date, s.time)} → ${dopo}` : `Sposto la seduta · ${dopo}`;
    }
    case "cancella_appuntamento": {
      const s = sedute.find((x) => x.id === a.dati.id);
      return s ? `Cancello ${s.type} con ${nomeDi(s.clientId)} · ${quando(s.date, s.time)}` : "Cancello la seduta";
    }
    case "scrivi_messaggio":
      return `Messaggio a ${nomeDi(a.dati.cliente)}`;
  }
}

export type StatoScheda = "da-confermare" | "in-corso" | "fatto" | "annullato" | "rifiutato" | "errore";

function cosa(a: AzioneLeo): string {
  switch (a.nome) {
    case "fissa_appuntamento":
      return `fissato ${a.dati.tipo.toLowerCase()} con ${codiceDi(a.dati.cliente)} il ${a.dati.data} alle ${a.dati.ora}`;
    case "sposta_appuntamento":
      return `spostato ${a.dati.id} a ${a.dati.data} ${a.dati.ora}`;
    case "cancella_appuntamento":
      return `cancellato ${a.dati.id}`;
    case "scrivi_messaggio":
      return `messaggio a ${codiceDi(a.dati.cliente)}`;
  }
}

// Nota per i turni successivi: cosa è successo alle azioni proposte, con i codici dei clienti (mai i nomi).
export function notaPerLeo(schede: { azione: AzioneLeo; stato: StatoScheda; motivo?: string }[]): string {
  const parti = schede.map(({ azione, stato, motivo }) => {
    if (stato === "fatto") return `fatto: ${cosa(azione)}`;
    if (stato === "annullato") return `${cosa(azione)} annullato dal trainer`;
    if (stato === "da-confermare" || stato === "in-corso") return `${cosa(azione)} in attesa del trainer`;
    return `${cosa(azione)} rifiutato dall'app (${pseudonimizza(motivo ?? "errore")})`;
  });
  return parti.length ? `(${parti.join("; ")})` : "";
}

// ——— Il menu per l'AI (formato tools dell'API compatibile OpenAI) ———

const cliente = { type: "string", description: "codice del cliente, per esempio C3" };
const data = { type: "string", description: "data nel formato AAAA-MM-GG, solo questa settimana o la prossima" };
const ora = { type: "string", description: "ora di inizio nel formato HH:MM, 24 ore" };

export const LEO_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "fissa_appuntamento",
      description: "Fissa una nuova seduta nel calendario del trainer. Usala solo se il trainer chiede di fissare o aggiungere un appuntamento e sono chiari cliente, giorno e ora.",
      parameters: {
        type: "object",
        properties: {
          cliente,
          data,
          ora,
          durata: { type: "integer", description: "durata in minuti (15-180); se il trainer non la dice usa 60" },
          tipo: { type: "string", enum: TIPI, description: "tipo di seduta; se non è detto usa Workout" },
          luogo: { type: "string", description: "facoltativo: lascialo vuoto per il luogo abituale" },
        },
        required: ["cliente", "data", "ora", "durata", "tipo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sposta_appuntamento",
      description: "Sposta una seduta esistente (indicata con il suo id, per esempio A12) a un altro giorno o ora.",
      parameters: {
        type: "object",
        properties: { id: { type: "string", description: "id della seduta, per esempio A12" }, data, ora, durata: { type: "integer", description: "facoltativa: nuova durata in minuti" } },
        required: ["id", "data", "ora"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancella_appuntamento",
      description: "Cancella una seduta esistente (indicata con il suo id). Il trainer dovrà confermare.",
      parameters: { type: "object", properties: { id: { type: "string", description: "id della seduta, per esempio A12" } }, required: ["id"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scrivi_messaggio",
      description:
        "Prepara un messaggio dal trainer a un cliente, nella chat dell'app. Il trainer lo legge e conferma prima dell'invio. Scrivi come se fossi il trainer, in prima persona, tono cordiale, senza firma; per il cliente usa il suo codice.",
      parameters: { type: "object", properties: { cliente, testo: { type: "string", description: "testo del messaggio, massimo 1000 caratteri" } }, required: ["cliente", "testo"] },
    },
  },
];
