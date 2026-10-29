// Le azioni di Leo sui dati del cliente: misure, obiettivo, note e nuovo cliente.
// Stessa struttura delle altre (leo-azioni.ts le riunisce). Misure, obiettivo e note partono subito con "Annulla";
// se arrivano da un file allegato si confermano (prima → dopo). Il nuovo cliente si conferma sempre e l'email la
// scrive il trainer nella scheda: lo schema la scarta se arriva dall'AI.

import { z } from "zod";
import { controllaNuovoCliente } from "@/libs/domain/clients";
import { controllaMisura } from "@/libs/domain/measurements";
import { no, OK, type Verifica } from "@/libs/domain/verifica";
import { oggi as giornoDiOggi } from "@/libs/orologio";
import type { DatiClienti, Misura } from "@/libs/dati/tipi";

export type AzioneClienti =
  | { nome: "aggiorna_misure"; dati: { cliente: string; data?: string; peso?: number; vita?: number; fianchi?: number; petto?: number; braccio?: number; coscia?: number } }
  | { nome: "aggiorna_obiettivo"; dati: { cliente: string; descrizione?: string; traguardo?: number; unita?: string } }
  | { nome: "aggiungi_nota"; dati: { cliente: string; testo: string } }
  | { nome: "nuovo_cliente"; dati: { nome: string; genere: "donna" | "uomo"; obiettivo?: string; email?: string } };

export const NOMI_CLIENTI = ["aggiorna_misure", "aggiorna_obiettivo", "aggiungi_nota", "nuovo_cliente"] as const;
export const eClienti = (nome: string): nome is AzioneClienti["nome"] => (NOMI_CLIENTI as readonly string[]).includes(nome);
// Quelle che cambiano dati esistenti: con un file allegato si confermano.
export const suDatiCliente = (nome: string) => nome === "aggiorna_misure" || nome === "aggiorna_obiettivo" || nome === "aggiungi_nota";

const MAX_NOTA = 500;
const vuotoComeAssente = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);
// "68,4" → 68.4; numeri già numeri restano tali. Un valore che non è un numero ("n/d", "-", "da misurare")
// si lascia fuori: non deve diventare 0 (Number("") vale 0) e finire in una scheda "0 kg?".
const Numero = z.preprocess((v) => {
  const x = vuotoComeAssente(v);
  if (typeof x !== "string") return x;
  const pulito = x.replace(",", ".").replace(/[^\d.-]/g, "");
  const n = Number(pulito);
  return pulito === "" || Number.isNaN(n) ? undefined : n;
}, z.number().finite().optional());
const Testo = (max: number) => z.preprocess(vuotoComeAssente, z.string().trim().max(max).optional());

export const SchemiClienti = {
  aggiorna_misure: z.object({
    cliente: z.string().min(1),
    data: z.preprocess(vuotoComeAssente, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    peso: Numero,
    vita: Numero,
    fianchi: Numero,
    petto: Numero,
    braccio: Numero,
    coscia: Numero,
  }),
  aggiorna_obiettivo: z.object({ cliente: z.string().min(1), descrizione: Testo(120), traguardo: Numero, unita: Testo(12) }),
  aggiungi_nota: z.object({ cliente: z.string().min(1), testo: z.string().trim().min(1).max(MAX_NOTA) }),
  nuovo_cliente: z.object({ nome: z.string().trim().min(1).max(80), genere: z.enum(["donna", "uomo"]), obiettivo: Testo(120) }),
};

export function inChiaroClienti(a: AzioneClienti, cliente: (v: string) => string | undefined): AzioneClienti | null {
  if (a.nome === "nuovo_cliente") return a;
  const id = cliente(a.dati.cliente);
  return id ? ({ ...a, dati: { ...a.dati, cliente: id } } as AzioneClienti) : null;
}

const CAMPI = [
  ["peso", "weightKg", "Peso", "kg"],
  ["vita", "waistCm", "Vita", "cm"],
  ["fianchi", "hipsCm", "Fianchi", "cm"],
  ["petto", "chestCm", "Petto", "cm"],
  ["braccio", "armCm", "Braccio", "cm"],
  ["coscia", "thighCm", "Coscia", "cm"],
] as const;

// La rilevazione da salvare, con solo i valori presenti.
export function misuraDa(a: Extract<AzioneClienti, { nome: "aggiorna_misure" }>): Omit<Misura, "id"> {
  const m: Omit<Misura, "id"> = { clientId: a.dati.cliente, takenOn: a.dati.data ?? giornoDiOggi() };
  for (const [da, a_] of CAMPI) if (a.dati[da] !== undefined) m[a_] = a.dati[da];
  return m;
}

const clienteDi = (d: DatiClienti, id: string) => d.clienti.find((c) => c.id === id);

export function verificaClienti(a: AzioneClienti, d: DatiClienti): Verifica {
  if (a.nome === "nuovo_cliente") return controllaNuovoCliente(a.dati.nome, d.clienti);
  if (!clienteDi(d, a.dati.cliente)) return no("Cliente non trovato");
  switch (a.nome) {
    case "aggiorna_misure":
      return controllaMisura(misuraDa(a), giornoDiOggi());
    case "aggiorna_obiettivo":
      return a.dati.descrizione || a.dati.traguardo !== undefined || a.dati.unita ? OK : no("Niente da cambiare nell'obiettivo");
    case "aggiungi_nota":
      return a.dati.testo.trim() ? OK : no("La nota è vuota");
  }
}

const numero = (n: number) => String(n).replace(".", ",");

// L'ultimo valore registrato di un campo (la rilevazione più recente che lo contiene).
function ultimo(d: DatiClienti, clientId: string, campo: keyof Misura): number | undefined {
  const righe = d.misure.filter((m) => m.clientId === clientId && m[campo] !== undefined).sort((x, y) => x.takenOn.localeCompare(y.takenOn));
  return righe.at(-1)?.[campo] as number | undefined;
}

// Le righe "prima → dopo" della scheda, per controllare i valori prima di confermare.
export function primaDopoClienti(a: AzioneClienti, d: DatiClienti): { voce: string; prima?: string; dopo: string }[] {
  if (a.nome === "aggiorna_misure") {
    return CAMPI.flatMap(([da, campo, voce, unita]) => {
      const nuovo = a.dati[da];
      if (nuovo === undefined) return [];
      const vecchio = ultimo(d, a.dati.cliente, campo);
      return [{ voce, ...(vecchio !== undefined ? { prima: `${numero(vecchio)} ${unita}` } : {}), dopo: `${numero(nuovo)} ${unita}` }];
    });
  }
  if (a.nome === "aggiorna_obiettivo") {
    const c = clienteDi(d, a.dati.cliente);
    if (!c) return [];
    const unita = a.dati.unita ?? c.goalUnit;
    return [
      ...(a.dati.descrizione ? [{ voce: "Obiettivo", prima: c.goalLabel, dopo: a.dati.descrizione }] : []),
      ...(a.dati.traguardo !== undefined ? [{ voce: "Traguardo", prima: `${numero(c.goalTarget)} ${c.goalUnit}`, dopo: `${numero(a.dati.traguardo)} ${unita}` }] : []),
    ];
  }
  return [];
}

export function riassuntoClienti(a: AzioneClienti, nomeDi: (id: string) => string): string {
  switch (a.nome) {
    case "aggiorna_misure": {
      const valori = CAMPI.flatMap(([da, , voce, unita]) => (a.dati[da] !== undefined ? [`${voce.toLowerCase()} ${numero(a.dati[da]!)} ${unita}`] : []));
      return `Misure di ${nomeDi(a.dati.cliente)} · ${valori.join(", ")}`;
    }
    case "aggiorna_obiettivo":
      return `Obiettivo di ${nomeDi(a.dati.cliente)}${a.dati.descrizione ? ` · ${a.dati.descrizione}` : ""}`;
    case "aggiungi_nota":
      return `Nota per ${nomeDi(a.dati.cliente)}`;
    case "nuovo_cliente":
      return `Nuovo cliente · ${a.dati.nome}`;
  }
}

export function cosaClienti(a: AzioneClienti, nomeDi: (id: string) => string): string {
  switch (a.nome) {
    case "aggiorna_misure":
      return `aggiornate le misure di ${nomeDi(a.dati.cliente)}`;
    case "aggiorna_obiettivo":
      return `aggiornato l'obiettivo di ${nomeDi(a.dati.cliente)}`;
    case "aggiungi_nota":
      return `nota aggiunta per ${nomeDi(a.dati.cliente)}`;
    case "nuovo_cliente":
      return `creato il cliente ${a.dati.nome}`;
  }
}

// ——— Il menu per l'AI ———

const cliente = { type: "string", description: "id del cliente, per esempio sara-conti" };
const misura = (cosa: string) => ({ type: "number", description: cosa });

export const TOOLS_CLIENTI = [
  {
    type: "function" as const,
    function: {
      name: "aggiorna_misure",
      description:
        "Salva una rilevazione nuova di peso e/o misure di un cliente. Metti solo i valori che il trainer ha detto o che leggi in un file allegato: non stimare e non copiare valori vecchi.",
      parameters: {
        type: "object",
        properties: {
          cliente,
          data: { type: "string", description: "facoltativa, AAAA-MM-GG; se manca è oggi" },
          peso: misura("peso in kg"),
          vita: misura("circonferenza vita in cm"),
          fianchi: misura("circonferenza fianchi in cm"),
          petto: misura("circonferenza petto in cm"),
          braccio: misura("circonferenza braccio in cm"),
          coscia: misura("circonferenza coscia in cm"),
        },
        required: ["cliente"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "aggiorna_obiettivo",
      description: "Cambia l'obiettivo di un cliente: la descrizione (per esempio \"Dimagrimento −10 kg\"), il traguardo numerico e/o l'unità.",
      parameters: {
        type: "object",
        properties: { cliente, descrizione: { type: "string" }, traguardo: { type: "number" }, unita: { type: "string", description: "kg, km, % …" } },
        required: ["cliente"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "aggiungi_nota",
      description: "Aggiunge una nota del trainer sul cliente (resta nel profilo, con la data). Scrivi solo quello che dice il trainer, breve.",
      parameters: { type: "object", properties: { cliente, testo: { type: "string", description: "massimo 500 caratteri" } }, required: ["cliente", "testo"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "nuovo_cliente",
      description: "Aggiunge un nuovo cliente all'app. Serve nome e cognome; l'email la inserisce il trainer nella scheda di conferma, tu non chiederla e non scriverla.",
      parameters: {
        type: "object",
        properties: { nome: { type: "string", description: "nome e cognome" }, genere: { type: "string", enum: ["donna", "uomo"] }, obiettivo: { type: "string", description: "facoltativo" } },
        required: ["nome", "genere"],
      },
    },
  },
];
