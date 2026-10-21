// Lettura di una scheda di allenamento da PDF: estrae il testo riga per riga (pdf.js, nel browser)
// e riconosce giorni ed esercizi. Nel prodotto vero qui si potrà aggiungere l'OCR per i PDF scansionati.

export type ParsedRow = { name: string; sets: string; load: string; rest: string };
export type ParsedDay = { label: string; focus: string; rows: ParsedRow[] };

// Il worker è copiato in public/ da node_modules/pdfjs-dist/build/pdf.worker.min.mjs:
// va ricopiato se si aggiorna pdfjs-dist.
const WORKER_SRC = "/prototipo/pdf.worker.min.mjs";

export async function readPdfLines(data: ArrayBuffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
  const doc = await pdfjs.getDocument({ data }).promise;
  const lines: string[] = [];

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    // Raggruppa i pezzi di testo che stanno sulla stessa riga (stessa y), poi li ordina da sinistra a destra.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3;
      const x = item.transform[4];
      rows.set(y, [...(rows.get(y) ?? []), { x, str: item.str.trim() }]);
    }
    [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, parts]) => lines.push(parts.sort((a, b) => a.x - b.x).map((p) => p.str).join("  ")));
  }
  return lines;
}

const DAY = /^(giorno|day|seduta|allenamento|scheda)\s+([a-z0-9]+)\b\s*[·:\-–—]?\s*(.*)$/i;
const SETS = /(\d+\s*[x×]\s*\d+(?:\s*(?:″|"|''|sec|s|min|′|m))?|\d+\s*[x×]\s*\d+\s*(?:km|m))/i;
const LOAD = /(\+?\d+(?:[.,]\d+)?\s*kg|corpo libero|—)/i;
const REST = /(\d+\s*(?:″|"|''|sec|s|′|min))/i;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function parsePlan(lines: string[]): ParsedDay[] {
  const days: ParsedDay[] = [];
  let current: ParsedDay | null = null;

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    const day = line.match(DAY);
    if (day && !SETS.test(line)) {
      current = { label: `${cap(day[1].toLowerCase())} ${day[2].toUpperCase()}`, focus: day[3] ? cap(day[3]) : "", rows: [] };
      days.push(current);
      continue;
    }
    const sets = line.match(SETS);
    if (!sets || sets.index === undefined) continue;

    const name = line
      .slice(0, sets.index)
      .replace(/^\d+[.)]\s*/, "")
      .trim();
    if (!name) continue;
    const after = line.slice(sets.index + sets[0].length);
    const load = after.match(LOAD);
    const afterLoad = load && load.index !== undefined ? after.slice(load.index + load[0].length) : after;
    const rest = afterLoad.match(REST);

    if (!current) {
      current = { label: "Giorno A", focus: "", rows: [] };
      days.push(current);
    }
    current.rows.push({
      name: cap(name),
      sets: sets[0].replace(/\s*[x×]\s*/i, " × ").replace(/''|"/g, "″"),
      load: load ? load[0].replace(/\s+kg/i, " kg") : "—",
      rest: rest ? rest[0].replace(/''|"|\s*sec|\s*s$/i, "″").replace(/\s+/g, "") : "—",
    });
  }
  return days.filter((d) => d.rows.length > 0);
}
