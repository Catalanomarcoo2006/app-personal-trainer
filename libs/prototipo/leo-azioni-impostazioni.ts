// Le azioni di Leo sulle impostazioni: colore del marchio, tema, suoni e notifiche. Partono subito, con "Annulla".
// Stessa struttura delle altre (leo-azioni.ts le riunisce).

import { z } from "zod";
import { no, OK, type Verifica } from "@/libs/domain/verifica";
import { coloreDa, nomeColore } from "@/libs/ui/colori";
import type { Notifiche } from "@/libs/dati/tipi";

export type AzioneImpostazioni =
  | { nome: "cambia_aspetto"; dati: { colore?: string; tema?: "chiaro" | "scuro"; suoni?: boolean } }
  | { nome: "imposta_notifiche"; dati: { tipo: keyof Notifiche; attiva: boolean } };

export const NOMI_IMPOSTAZIONI = ["cambia_aspetto", "imposta_notifiche"] as const;
export const eImpostazioni = (nome: string): nome is AzioneImpostazioni["nome"] => (NOMI_IMPOSTAZIONI as readonly string[]).includes(nome);

export const NOTIFICHE: Record<keyof Notifiche, string> = {
  dolore: "Dolore segnalato",
  spostamento: "Richiesta di spostamento",
  pacchetti: "Pacchetti in scadenza",
  riepilogo: "Riepilogo del lunedì",
  avvisoDolori: "Avvisami sui dolori",
};
const TIPI = Object.keys(NOTIFICHE) as [keyof Notifiche, ...(keyof Notifiche)[]];

const vuotoComeAssente = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);
// il nome del colore ("blu") diventa il suo codice; un codice resta com'è, così rileggere l'azione non la cambia
const Colore = z.preprocess((v) => {
  const x = vuotoComeAssente(v);
  return typeof x === "string" ? (coloreDa(x) ?? "non valido") : x;
}, z.string().regex(/^#[0-9a-f]{6}$/).optional());
const SiNo = z.preprocess((v) => (v === "true" ? true : v === "false" ? false : vuotoComeAssente(v)), z.boolean().optional());

export const SchemiImpostazioni = {
  cambia_aspetto: z.object({ colore: Colore, tema: z.preprocess(vuotoComeAssente, z.enum(["chiaro", "scuro"]).optional()), suoni: SiNo }),
  imposta_notifiche: z.object({ tipo: z.enum(TIPI), attiva: z.preprocess((v) => (v === "true" ? true : v === "false" ? false : v), z.boolean()) }),
};

export function verificaImpostazioni(a: AzioneImpostazioni): Verifica {
  if (a.nome === "imposta_notifiche") return OK;
  return a.dati.colore !== undefined || a.dati.tema !== undefined || a.dati.suoni !== undefined ? OK : no("Niente da cambiare");
}

export function riassuntoImpostazioni(a: AzioneImpostazioni): string {
  if (a.nome === "imposta_notifiche") return `${a.dati.attiva ? "Accendo" : "Spengo"} la notifica · ${NOTIFICHE[a.dati.tipo]}`;
  const parti = [
    a.dati.colore && `colore ${nomeColore(a.dati.colore).toLowerCase()}`,
    a.dati.tema && `tema ${a.dati.tema}`,
    a.dati.suoni !== undefined && `suoni ${a.dati.suoni ? "accesi" : "spenti"}`,
  ].filter(Boolean);
  return `Aspetto · ${parti.join(", ")}`;
}

export const cosaImpostazioni = (a: AzioneImpostazioni) => riassuntoImpostazioni(a).toLowerCase();

// ——— Il menu per l'AI ———

export const TOOLS_IMPOSTAZIONI = [
  {
    type: "function" as const,
    function: {
      name: "cambia_aspetto",
      description:
        "Cambia l'aspetto dell'app: colore del marchio (arancione, rosso, fucsia, viola, blu, verde acqua, verde, ocra o un codice #rrggbb), tema chiaro o scuro, suoni accesi o spenti. Metti solo quello che il trainer chiede.",
      parameters: {
        type: "object",
        properties: { colore: { type: "string" }, tema: { type: "string", enum: ["chiaro", "scuro"] }, suoni: { type: "boolean" } },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "imposta_notifiche",
      description: `Accende o spegne un tipo di avviso. Tipi: ${TIPI.map((t) => `${t} (${NOTIFICHE[t]})`).join(", ")}.`,
      parameters: { type: "object", properties: { tipo: { type: "string", enum: TIPI }, attiva: { type: "boolean" } }, required: ["tipo", "attiva"] },
    },
  },
];
