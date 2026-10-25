// Le azioni di Leo sui soldi: segnare un pagamento, registrarne uno nuovo, rinnovare un pacchetto, sollecitare.
// Stessa struttura delle azioni del calendario (leo-azioni.ts, che le riunisce): schema, controllo, riassunto,
// voce del menu per l'AI. Si confermano tutte prima di partire. Nell'azione l'importo resta in euro (server e browser
// la leggono entrambi: rileggerla non deve cambiarlo); diventa centesimi quando si scrive nei dati (cent()).

import { z } from "zod";
import { controllaImporto, controllaPagabile, euroInCentesimi } from "@/libs/domain/payments";
import { controllaRinnovo } from "@/libs/domain/rinnovi";
import { no, OK, type Verifica } from "@/libs/domain/verifica";
import { euroDa } from "@/libs/dati/testi";
import type { DatiClienti } from "@/libs/dati/tipi";

export type AzioneSoldi =
  | { nome: "segna_pagato"; dati: { pagamento: string } }
  | { nome: "registra_pagamento"; dati: { cliente: string; importo: number; descrizione: string; data?: string } }
  | { nome: "rinnova_pacchetto"; dati: { cliente: string; lezioni?: number; mesi?: number; importo: number } }
  | { nome: "sollecita"; dati: { pagamento: string; testo?: string } };

export const NOMI_SOLDI = ["segna_pagato", "registra_pagamento", "rinnova_pacchetto", "sollecita"] as const;
export const eSoldi = (nome: string): nome is AzioneSoldi["nome"] => (NOMI_SOLDI as readonly string[]).includes(nome);

const MAX_TESTO = 1000;
const vuotoComeAssente = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);
const Importo = z.preprocess((v) => {
  const c = euroInCentesimi(v);
  return c === null ? v : c / 100;
}, z.number());
export const cent = (euro: number) => Math.round(euro * 100);
const IdPagamento = z.string().trim().min(1).max(12);
const Intero = z.preprocess(vuotoComeAssente, z.coerce.number().int().optional());

export const SchemiSoldi = {
  segna_pagato: z.object({ pagamento: IdPagamento }),
  registra_pagamento: z.object({
    cliente: z.string().min(1),
    importo: Importo,
    descrizione: z.string().trim().min(1).max(120),
    data: z.preprocess(vuotoComeAssente, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  }),
  rinnova_pacchetto: z
    .object({ cliente: z.string().min(1), lezioni: Intero, mesi: Intero, importo: Importo })
    .refine((d) => (d.lezioni === undefined) !== (d.mesi === undefined)),
  sollecita: z.object({ pagamento: IdPagamento, testo: z.preprocess(vuotoComeAssente, z.string().trim().max(MAX_TESTO).optional()) }),
};

// Gli id dei pagamenti si scrivono in maiuscolo ("p2" → "P2"); il cliente lo risolve chi chiama.
export function inChiaroSoldi(a: AzioneSoldi, cliente: (v: string) => string | undefined): AzioneSoldi | null {
  if (a.nome === "segna_pagato" || a.nome === "sollecita") return { ...a, dati: { ...a.dati, pagamento: a.dati.pagamento.toUpperCase() } } as AzioneSoldi;
  const id = cliente(a.dati.cliente);
  return id ? ({ ...a, dati: { ...a.dati, cliente: id } } as AzioneSoldi) : null;
}

const pagamentoDi = (d: DatiClienti, id: string) => d.pagamenti.find((p) => p.id === id);
const clienteDi = (d: DatiClienti, id: string) => d.clienti.find((c) => c.id === id);

export function verificaSoldi(a: AzioneSoldi, d: DatiClienti): Verifica {
  switch (a.nome) {
    case "segna_pagato":
      return controllaPagabile(pagamentoDi(d, a.dati.pagamento));
    case "sollecita": {
      const v = controllaPagabile(pagamentoDi(d, a.dati.pagamento));
      if (!v.ok) return "motivo" in v && v.motivo === "Il pagamento è già segnato" ? no("Il pagamento è già stato fatto: niente sollecito") : v;
      return OK;
    }
    case "registra_pagamento":
      if (!clienteDi(d, a.dati.cliente)) return no("Cliente non trovato");
      return controllaImporto(cent(a.dati.importo));
    case "rinnova_pacchetto": {
      const c = clienteDi(d, a.dati.cliente);
      if (!c) return no("Cliente non trovato");
      const v = controllaRinnovo(
        d.pacchetti.find((p) => p.clientId === c.id),
        c.name,
        a.dati,
      );
      return v.ok ? controllaImporto(cent(a.dati.importo)) : v;
    }
  }
}

// "ad Antonella", "a Luca"
const a_ = (nome: string) => (/^[aeiouAEIOU]/.test(nome) ? `ad ${nome}` : `a ${nome}`);

export function riassuntoSoldi(a: AzioneSoldi, d: DatiClienti, nomeDi: (id: string) => string): string {
  switch (a.nome) {
    case "segna_pagato": {
      const p = pagamentoDi(d, a.dati.pagamento);
      return p ? `Segno pagato · ${nomeDi(p.clientId)} · ${euroDa(p.amountCents)} (${p.description.toLowerCase()})` : "Segno pagato un pagamento";
    }
    case "registra_pagamento":
      return `Registro ${euroDa(cent(a.dati.importo))} da ${nomeDi(a.dati.cliente)} · ${a.dati.descrizione}`;
    case "rinnova_pacchetto": {
      const quanto = a.dati.lezioni !== undefined ? `+${a.dati.lezioni} ${a.dati.lezioni === 1 ? "lezione" : "lezioni"}` : `+${a.dati.mesi} ${a.dati.mesi === 1 ? "mese" : "mesi"}`;
      return `Rinnovo ${nomeDi(a.dati.cliente)} · ${quanto} · ${euroDa(cent(a.dati.importo))} da incassare`;
    }
    case "sollecita": {
      const p = pagamentoDi(d, a.dati.pagamento);
      return p ? `Sollecito ${a_(nomeDi(p.clientId))} · ${euroDa(p.amountCents)}` : "Sollecito di pagamento";
    }
  }
}

// Per la nota ai turni successivi di Leo.
export function cosaSoldi(a: AzioneSoldi, nomeDi: (id: string) => string): string {
  switch (a.nome) {
    case "segna_pagato":
      return `segnato pagato ${a.dati.pagamento}`;
    case "registra_pagamento":
      return `registrato pagamento di ${euroDa(cent(a.dati.importo))} da ${nomeDi(a.dati.cliente)}`;
    case "rinnova_pacchetto":
      return `rinnovato il pacchetto di ${nomeDi(a.dati.cliente)}`;
    case "sollecita":
      return `sollecito per ${a.dati.pagamento}`;
  }
}

// ——— Il menu per l'AI ———

const cliente = { type: "string", description: "id del cliente, per esempio sara-conti" };
const pagamento = { type: "string", description: "id del pagamento, per esempio P7 (lo trovi tra i pagamenti del cliente)" };
const importo = { type: "number", description: "importo in euro, per esempio 450 o 120.50" };

export const TOOLS_SOLDI = [
  {
    type: "function" as const,
    function: {
      name: "segna_pagato",
      description: "Segna come incassato un pagamento che il cliente doveva ancora fare (DA PAGARE). Usala quando il trainer dice che un cliente ha pagato. Il trainer conferma.",
      parameters: { type: "object", properties: { pagamento }, required: ["pagamento"] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "registra_pagamento",
      description: "Registra un incasso nuovo, già ricevuto, che non è tra i pagamenti da incassare (per esempio una lezione singola pagata in contanti). Se il cliente paga un pagamento DA PAGARE usa segna_pagato. Il trainer conferma.",
      parameters: {
        type: "object",
        properties: { cliente, importo, descrizione: { type: "string", description: "cosa ha pagato, breve (per esempio Mensile novembre)" }, data: { type: "string", description: "facoltativa, AAAA-MM-GG; se manca è oggi" } },
        required: ["cliente", "importo", "descrizione"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "rinnova_pacchetto",
      description:
        "Rinnova il pacchetto di un cliente: per i pacchetti a lezioni indica lezioni, per quelli a tempo (mensile, trimestrale) indica mesi; mai entrambi. Crea anche il pagamento da incassare. Se il trainer non dice l'importo, chiedilo invece di inventarlo. Il trainer conferma.",
      parameters: {
        type: "object",
        properties: { cliente, lezioni: { type: "integer", description: "lezioni in più (1-50), solo per pacchetti a lezioni" }, mesi: { type: "integer", description: "mesi in più (1-12), solo per pacchetti a tempo" }, importo },
        required: ["cliente", "importo"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "sollecita",
      description: "Manda al cliente un promemoria cordiale per un pagamento DA PAGARE, nella chat dell'app. Il testo è facoltativo: se lo scrivi, in prima persona come il trainer, breve, con l'importo. Il trainer lo legge e conferma.",
      parameters: { type: "object", properties: { pagamento, testo: { type: "string", description: "facoltativo, massimo 1000 caratteri" } }, required: ["pagamento"] },
    },
  },
];
