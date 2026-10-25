// Il flusso della risposta di Leo: lato server si ricompongono le azioni (tool_calls) che l'AI manda a pezzi,
// lato browser si leggono gli eventi NDJSON (una riga JSON per evento) che la rotta restituisce.

import { leggiAzione, MAX_AZIONI, type AzioneLeo } from "./leo-azioni";

// azione-scartata: l'AI ha proposto un'azione che non si riesce a leggere; la chat lo dice invece di tacere.
export type EventoLeo = { tipo: "testo"; v: string } | ({ tipo: "azione" } & AzioneLeo) | { tipo: "errore"; v: string } | { tipo: "azione-scartata"; nome: string };

// Accumula delta.tool_calls per indice; alla fine ogni azione si legge e si controlla (le malformate si scartano).
export function raccoglitoreAzioni(): { aggiungi(toolCalls: unknown): void; azioni(): AzioneLeo[]; risultato(): { azioni: AzioneLeo[]; scartate: string[] } } {
  const parti = new Map<number, { nome: string; argomenti: string }>();
  return {
    aggiungi(toolCalls) {
      if (!Array.isArray(toolCalls)) return;
      for (const t of toolCalls) {
        if (typeof t?.index !== "number") continue;
        const p = parti.get(t.index) ?? { nome: "", argomenti: "" };
        if (typeof t.function?.name === "string") p.nome += t.function.name;
        if (typeof t.function?.arguments === "string") p.argomenti += t.function.arguments;
        parti.set(t.index, p);
      }
    },
    azioni() {
      return this.risultato().azioni;
    },
    risultato() {
      const out: AzioneLeo[] = [];
      const scartate: string[] = [];
      for (const [, p] of [...parti].sort(([a], [b]) => a - b)) {
        let argomenti: unknown;
        try {
          argomenti = JSON.parse(p.argomenti || "{}");
        } catch {
          console.warn("Leo: argomenti dell'azione non leggibili", p.nome);
          scartate.push(p.nome);
          continue;
        }
        const azione = leggiAzione(p.nome, argomenti);
        if (azione) out.push(azione);
        else {
          console.warn("Leo: azione scartata", p.nome, p.argomenti.slice(0, 200));
          scartate.push(p.nome);
        }
      }
      return { azioni: out.slice(0, MAX_AZIONI), scartate };
    },
  };
}

function evento(riga: string): EventoLeo | null {
  let e: { tipo?: unknown; v?: unknown; nome?: unknown; dati?: unknown };
  try {
    e = JSON.parse(riga);
  } catch {
    return null;
  }
  if ((e.tipo === "testo" || e.tipo === "errore") && typeof e.v === "string") return { tipo: e.tipo, v: e.v };
  if (e.tipo === "azione-scartata" && typeof e.nome === "string") return { tipo: "azione-scartata", nome: e.nome.slice(0, 60) };
  if (e.tipo === "azione" && typeof e.nome === "string") {
    const azione = leggiAzione(e.nome, e.dati);
    return azione ? { tipo: "azione", ...azione } : null;
  }
  return null;
}

// Per il browser: riceve il testo man mano che arriva e chiama onEvento per ogni riga completa e valida.
export function lettoreNdjson(onEvento: (e: EventoLeo) => void): { scrivi(pezzo: string): void; chiudi(): void } {
  let resto = "";
  const leggi = (riga: string) => {
    const e = riga.trim() ? evento(riga) : null;
    if (e) onEvento(e);
  };
  return {
    scrivi(pezzo) {
      resto += pezzo;
      const righe = resto.split("\n");
      resto = righe.pop() ?? "";
      righe.forEach(leggi);
    },
    chiudi() {
      leggi(resto);
      resto = "";
    },
  };
}
