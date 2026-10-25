// Lettura dei file Excel (.xlsx) nel browser: tutti i fogli, con le celle così come sono.
// Caricato solo quando il trainer allega un Excel (import dinamico da leo-file).

import readXlsxFile from "read-excel-file/browser";
import type { Foglio } from "./leo-file";

export async function leggiExcel(dati: ArrayBuffer): Promise<Foglio[]> {
  const fogli = await readXlsxFile(dati);
  return fogli.map((f) => ({ nome: f.sheet, righe: f.data as Foglio["righe"] }));
}
