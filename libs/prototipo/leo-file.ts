// I file allegati nella chat di Leo: l'app li legge nel browser (PDF con testo, Excel, CSV, TXT), toglie email e telefoni
// e ne manda a Leo al massimo 6.000 caratteri, dentro il messaggio del trainer. Foto e scansioni non ancora:
// servirà un modello che vede le immagini (fornitore UE).

import { ripulisci } from "./leo-contesto";

export { bloccoAllegato, conAllegato } from "./leo-allegato";

export const MAX_TESTO_FILE = 6000;
const MAX_BYTE = 5 * 1024 * 1024;
const MIN_TESTO_PDF = 20; // meno di così: è una scansione, non c'è testo da leggere

export const ACCETTATI = ".pdf,.xlsx,.csv,.txt";

export type FileLetto = { ok: true; nome: string; testo: string; tagliato: boolean } | { ok: false; motivo: string };

// Un foglio di un file Excel: le celle come le dà la libreria (testo, numero, data, sì/no o vuota).
export type Foglio = { nome: string; righe: (string | number | boolean | Date | null)[][] };

const cella = (v: string | number | boolean | Date | null): string => {
  if (v === null) return "";
  if (v instanceof Date) return `${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}/${v.getUTCFullYear()}`;
  if (typeof v === "number") return String(v).replace(".", ",");
  if (typeof v === "boolean") return v ? "sì" : "no";
  return v.trim();
};

// I fogli diventano righe separate da punto e virgola (come un CSV italiano), senza righe e colonne vuote in fondo.
function fogliInTesto(fogli: Foglio[]): string {
  const pieni = fogli
    .map((f) => ({ nome: f.nome, righe: f.righe.map((r) => r.map(cella).join(";").replace(/;+$/, "")).filter((r) => r.replace(/;/g, "").trim()) }))
    .filter((f) => f.righe.length);
  if (pieni.length === 1) return pieni[0].righe.join("\n");
  return pieni.map((f) => `Foglio "${f.nome}"\n${f.righe.join("\n")}`).join("\n\n");
}

// lettorePdf / lettoreExcel: pdf.js e read-excel-file nel browser; nei test se ne passano di finti.
export async function leggiFile(
  file: File,
  lettorePdf?: (dati: ArrayBuffer) => Promise<string[]>,
  lettoreExcel?: (dati: ArrayBuffer) => Promise<Foglio[]>,
): Promise<FileLetto> {
  const est = file.name.toLowerCase().split(".").pop() ?? "";
  if (est === "xls") return { ok: false, motivo: "Questo è un Excel vecchio (.xls): salvalo come .xlsx e riallegalo" };
  if (!["pdf", "xlsx", "csv", "txt"].includes(est)) return { ok: false, motivo: "Per ora leggo PDF, Excel, CSV e TXT" };
  if (file.size > MAX_BYTE) return { ok: false, motivo: "Il file è troppo grande (massimo 5 MB)" };

  let testo: string;
  if (est === "pdf") {
    const leggi = lettorePdf ?? (await import("./pdf-scheda")).readPdfLines;
    testo = (await leggi(await file.arrayBuffer())).join("\n");
    if (testo.trim().length < MIN_TESTO_PDF) return { ok: false, motivo: "Questo PDF è una foto: per ora leggo solo PDF con testo" };
  } else if (est === "xlsx") {
    try {
      const leggi = lettoreExcel ?? (await import("./excel")).leggiExcel;
      testo = fogliInTesto(await leggi(await file.arrayBuffer()));
    } catch {
      return { ok: false, motivo: "Non riesco ad aprire questo file Excel" };
    }
    if (!testo) return { ok: false, motivo: "Questo file Excel è vuoto" };
  } else {
    testo = await file.text();
  }

  const pulito = ripulisci(testo.trim());
  return { ok: true, nome: file.name, testo: pulito.slice(0, MAX_TESTO_FILE), tagliato: pulito.length > MAX_TESTO_FILE };
}
