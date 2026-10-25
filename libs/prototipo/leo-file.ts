// I file allegati nella chat di Leo: l'app li legge nel browser (PDF con testo, CSV, TXT), toglie email e telefoni
// e ne manda a Leo al massimo 6.000 caratteri, dentro il messaggio del trainer. Foto e scansioni non ancora:
// servirà un modello che vede le immagini (fornitore UE).

import { ripulisci } from "./leo-contesto";

export { bloccoAllegato, conAllegato } from "./leo-allegato";

export const MAX_TESTO_FILE = 6000;
const MAX_BYTE = 5 * 1024 * 1024;
const MIN_TESTO_PDF = 20; // meno di così: è una scansione, non c'è testo da leggere

export const ACCETTATI = ".pdf,.csv,.txt";

export type FileLetto = { ok: true; nome: string; testo: string; tagliato: boolean } | { ok: false; motivo: string };

// lettorePdf: le righe di testo di un PDF (pdf.js nel browser); nei test se ne passa uno finto.
export async function leggiFile(file: File, lettorePdf?: (dati: ArrayBuffer) => Promise<string[]>): Promise<FileLetto> {
  const est = file.name.toLowerCase().split(".").pop() ?? "";
  if (!["pdf", "csv", "txt"].includes(est)) return { ok: false, motivo: "Per ora leggo PDF, CSV e TXT" };
  if (file.size > MAX_BYTE) return { ok: false, motivo: "Il file è troppo grande (massimo 5 MB)" };

  let testo: string;
  if (est === "pdf") {
    const leggi = lettorePdf ?? (await import("./pdf-scheda")).readPdfLines;
    testo = (await leggi(await file.arrayBuffer())).join("\n");
    if (testo.trim().length < MIN_TESTO_PDF) return { ok: false, motivo: "Questo PDF è una foto: per ora leggo solo PDF con testo" };
  } else {
    testo = await file.text();
  }

  const pulito = ripulisci(testo.trim());
  return { ok: true, nome: file.name, testo: pulito.slice(0, MAX_TESTO_FILE), tagliato: pulito.length > MAX_TESTO_FILE };
}
