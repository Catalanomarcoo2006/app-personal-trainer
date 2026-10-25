// Le azioni di Leo: il menu che l'AI riceve (tool calling), gli schemi per controllarne la forma
// e i controlli dell'app prima di eseguirle. Logica pura: la usano la rotta, il browser e i test.
// Con Supabase gli stessi schemi e controlli passeranno lato server.

import { z } from "zod";
import { clientById, trainer, type Appointment, type AppointmentType } from "./dati-finti";
import type { DatiClienti } from "@/libs/dati/tipi";
import { giornoDi, isoDi } from "./calendario";
import { clienteDa } from "./leo-contesto";
import { no, type Verifica } from "@/libs/domain/verifica";

// Una seduta del calendario con id stabile (A1, A2, …) e data vera.
export type Seduta = Appointment & { id: string; date: string }; // date "AAAA-MM-GG"

export type AzioneLeo =
  | { nome: "fissa_appuntamento"; dati: { cliente: string; data: string; ora: string; durata: number; tipo: AppointmentType; luogo?: string } }
  | { nome: "sposta_appuntamento"; dati: { id: string; data: string; ora: string; durata?: number } }
  | { nome: "cancella_appuntamento"; dati: { id: string } }
  | { nome: "scrivi_messaggio"; dati: { cliente: string; testo: string } }
  | { nome: "scrivi_a_piu"; dati: { clienti: string[]; testo: string } };

// Quello che i controlli guardano: il calendario e i dati dei clienti di adesso.
export type DatiLeo = { sedute: Seduta[]; dati: DatiClienti };

export const MAX_AZIONI = 10;
export const TIPI: AppointmentType[] = ["Workout", "Valutazione", "Online", "Corsa"];

// La demo è ferma a mercoledì 21 ottobre 2026; Leo agisce su questa settimana (19–25) e sulla prossima.
export const ADESSO = { data: "2026-10-21", ora: trainer.now } as const;
export const GIORNI_LEO: string[] = Array.from({ length: 14 }, (_, i) => isoDi(giornoDi(0, i)));

const ORA_INIZIO = 6 * 60;
const ORA_FINE = 22 * 60;
const DURATA = { min: 15, max: 180 };
const MAX_TESTO = 1000;
const MAX_DESTINATARI = 50;

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
// campi facoltativi lasciati vuoti dall'AI ("", null): valgono come non scritti
const vuotoComeAssente = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);

const Schemi = {
  fissa_appuntamento: z.object({
    cliente: z.string().min(1),
    data: Data,
    ora: Ora,
    durata: Durata,
    tipo: z.enum(["Workout", "Valutazione", "Online", "Corsa"]),
    luogo: z.preprocess(vuotoComeAssente, z.string().max(80).optional()),
  }),
  sposta_appuntamento: z.object({ id: z.string().min(1), data: Data, ora: Ora, durata: z.preprocess(vuotoComeAssente, Durata.optional()) }),
  cancella_appuntamento: z.object({ id: z.string().min(1) }),
  scrivi_messaggio: z.object({ cliente: z.string().min(1), testo: z.string().trim().min(1).max(MAX_TESTO) }),
  scrivi_a_piu: z.object({ clienti: z.array(z.string().min(1)).max(60), testo: z.string().trim().min(1).max(MAX_TESTO) }),
};

// Il nome e gli argomenti arrivati dall'AI diventano un'azione, oppure null se la forma è sbagliata.
export function leggiAzione(nome: string, argomenti: unknown): AzioneLeo | null {
  if (!(nome in Schemi)) return null;
  const r = Schemi[nome as keyof typeof Schemi].safeParse(argomenti);
  return r.success ? ({ nome, dati: r.data } as AzioneLeo) : null;
}

// Dal cliente indicato dall'AI (id, nome completo o nome) all'id vero. null se il cliente non esiste.
// elenco: i clienti di adesso (anche quelli creati nell'app); senza, quelli della demo.
export function inChiaro(a: AzioneLeo, elenco?: { id: string; name: string }[]): AzioneLeo | null {
  if (a.nome === "scrivi_a_piu") {
    const clienti = a.dati.clienti.map((c) => clienteDa(c, elenco));
    if (clienti.some((c) => !c)) return null;
    return { nome: a.nome, dati: { clienti: clienti as string[], testo: a.dati.testo } };
  }
  if (a.nome === "fissa_appuntamento" || a.nome === "scrivi_messaggio") {
    const cliente = clienteDa(a.dati.cliente, elenco);
    if (!cliente) return null;
    if (a.nome === "scrivi_messaggio") return { nome: a.nome, dati: { cliente, testo: a.dati.testo } };
    return { nome: a.nome, dati: { ...a.dati, cliente } };
  }
  return a;
}

// ——— Controlli dell'app ———

export type { Verifica };
// Il nome del cliente tra quelli di adesso (anche creati nell'app), altrimenti tra quelli della demo.
let nomiAttuali: DatiClienti["clienti"] = [];
const nomeDi = (id: string) => nomiAttuali.find((c) => c.id === id)?.name ?? clientById(id)?.name ?? "un altro cliente";
const esiste = (d: DatiLeo, id: string) => d.dati.clienti.some((c) => c.id === id);

// "Ciao {nome}!" → "Ciao Giulia!": il primo nome di ogni destinatario.
export const personalizza = (testo: string, nomeCompleto: string) => testo.replaceAll("{nome}", nomeCompleto.split(" ")[0]);

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

// a è già in chiaro (inChiaro): i clienti sono id.
export function verificaAzione(a: AzioneLeo, d: DatiLeo, adesso: { data: string; ora: string } = ADESSO): Verifica {
  const { sedute } = d;
  nomiAttuali = d.dati.clienti;
  switch (a.nome) {
    case "fissa_appuntamento":
      if (!esiste(d, a.dati.cliente)) return no("Cliente non trovato");
      return controllaOrario(a.dati.data, a.dati.ora, a.dati.durata, sedute, adesso);
    case "sposta_appuntamento": {
      const s = sedute.find((x) => x.id === a.dati.id);
      if (!s) return no("Appuntamento non trovato");
      return controllaOrario(a.dati.data, a.dati.ora, a.dati.durata ?? s.minutes, sedute, adesso, s.id);
    }
    case "cancella_appuntamento":
      return sedute.some((x) => x.id === a.dati.id) ? { ok: true } : no("Appuntamento non trovato");
    case "scrivi_messaggio":
      if (!esiste(d, a.dati.cliente)) return no("Cliente non trovato");
      return a.dati.testo.trim() && a.dati.testo.length <= MAX_TESTO ? { ok: true } : no("Il messaggio è vuoto o troppo lungo");
    case "scrivi_a_piu": {
      if (!a.dati.clienti.length) return no("Scegli almeno un cliente");
      if (a.dati.clienti.length > MAX_DESTINATARI) return no(`Al massimo ${MAX_DESTINATARI} clienti`);
      if (a.dati.clienti.some((c) => !esiste(d, c))) return no("Cliente non trovato");
      if (/\{(?!nome\})[^}]*\}/.test(a.dati.testo)) return no("Nel testo uso solo {nome}");
      return a.dati.testo.trim() && a.dati.testo.length <= MAX_TESTO ? { ok: true } : no("Il messaggio è vuoto o troppo lungo");
    }
  }
}

// Cancellare e scrivere al cliente solo dopo il tocco del trainer; fissare e spostare subito, con "Annulla".
export const daConfermare = (a: AzioneLeo) => a.nome === "cancella_appuntamento" || a.nome === "scrivi_messaggio" || a.nome === "scrivi_a_piu";

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
export function riassunto(a: AzioneLeo, d: DatiLeo): string {
  const { sedute } = d;
  nomiAttuali = d.dati.clienti;
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
    case "scrivi_a_piu":
      return a.dati.clienti.length === 1 ? `Messaggio a ${nomeDi(a.dati.clienti[0])}` : `Messaggio a ${a.dati.clienti.length} clienti`;
  }
}

export type StatoScheda = "da-confermare" | "in-corso" | "fatto" | "annullato" | "rifiutato" | "errore";

function cosa(a: AzioneLeo): string {
  switch (a.nome) {
    case "fissa_appuntamento":
      return `fissato ${a.dati.tipo.toLowerCase()} con ${nomeDi(a.dati.cliente)} il ${a.dati.data} alle ${a.dati.ora}`;
    case "sposta_appuntamento":
      return `spostato ${a.dati.id} a ${a.dati.data} ${a.dati.ora}`;
    case "cancella_appuntamento":
      return `cancellato ${a.dati.id}`;
    case "scrivi_messaggio":
      return `messaggio a ${nomeDi(a.dati.cliente)}`;
    case "scrivi_a_piu":
      return `messaggio a ${a.dati.clienti.map(nomeDi).join(", ")}`;
  }
}

// Nota per i turni successivi: cosa è successo alle azioni proposte.
export function notaPerLeo(schede: { azione: AzioneLeo; stato: StatoScheda; motivo?: string }[]): string {
  const parti = schede.map(({ azione, stato, motivo }) => {
    if (stato === "fatto") return `fatto: ${cosa(azione)}`;
    if (stato === "annullato") return `${cosa(azione)} annullato dal trainer`;
    if (stato === "da-confermare" || stato === "in-corso") return `${cosa(azione)} in attesa del trainer`;
    return `${cosa(azione)} rifiutato dall'app (${motivo ?? "errore"})`;
  });
  return parti.length ? `(${parti.join("; ")})` : "";
}

// ——— Il menu per l'AI (formato tools dell'API compatibile OpenAI) ———

const cliente = { type: "string", description: "id del cliente, per esempio sara-conti" };
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
          luogo: { type: "string", description: "facoltativo: ometti il campo per il luogo abituale" },
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
        "Prepara un messaggio dal trainer a un cliente, nella chat dell'app. Il trainer lo legge e conferma prima dell'invio. Scrivi come se fossi il trainer, in prima persona, tono cordiale, breve, senza firma; chiama il cliente per nome. Scrivi solo quello che il trainer ti ha chiesto di dire: niente consigli di allenamento, salute o alimentazione aggiunti da te.",
      parameters: { type: "object", properties: { cliente, testo: { type: "string", description: "testo del messaggio, massimo 1000 caratteri" } }, required: ["cliente", "testo"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scrivi_a_piu",
      description:
        "Prepara lo stesso messaggio per più clienti insieme (per esempio tutti quelli col pacchetto in scadenza). Usalo invece di tanti scrivi_messaggio. Scrivi {nome} dove va il nome del cliente: l'app lo sostituisce per ognuno. Stesse regole di scrivi_messaggio; il trainer sceglie i destinatari e conferma.",
      parameters: {
        type: "object",
        properties: {
          clienti: { type: "array", items: { type: "string" }, description: "id dei clienti, per esempio [\"sara-conti\", \"luca-ferri\"]" },
          testo: { type: "string", description: "testo uguale per tutti, con {nome} al posto del nome; massimo 1000 caratteri" },
        },
        required: ["clienti", "testo"],
      },
    },
  },
];
