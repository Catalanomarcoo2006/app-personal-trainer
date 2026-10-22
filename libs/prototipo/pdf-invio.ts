// PDF della scheda che il trainer invia al cliente, generato nel browser (pdf-lib, caricato solo all'invio).
// Sotto ogni esercizio c'è il link cliccabile al video dell'esecuzione.

type Input = {
  clientName: string;
  trainerName: string;
  date: string;
  color: string; // colore del trainer, "#rrggbb"
  days: { label: string; focus: string; rows: { name: string; sets: string; load: string; rest: string; video?: string }[] }[];
};

// I font standard del PDF conoscono solo l'alfabeto latino (WinAnsi): sostituisce i simboli che non hanno.
const clean = (s: string) =>
  s
    .replace(/\u2033/g, '"')
    .replace(/\u2032/g, "'")
    .replace(/[^\x20-\x7e\u00a0-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u20ac]/g, "")
    .trim();

const hex = (c: string) => {
  const n = parseInt(c.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

export async function buildPlanPdf(input: Input): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb, PDFString } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  doc.setTitle(`Scheda di allenamento · ${clean(input.clientName)}`);
  doc.setAuthor(clean(input.trainerName));

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const accent = rgb(...hex(input.color));
  const ink = rgb(0.11, 0.11, 0.12);
  const muted = rgb(0.5, 0.5, 0.53);
  const line = rgb(0.9, 0.9, 0.91);

  const W = 595.28;
  const H = 841.89;
  const M = 48;
  let page = doc.addPage([W, H]);
  let y = H - M;

  const newPage = () => {
    page = doc.addPage([W, H]);
    y = H - M;
  };
  const ensure = (space: number) => {
    if (y - space < M) newPage();
  };

  const link = (x: number, yy: number, w: number, h: number, url: string) => {
    const annot = doc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, yy, x + w, yy + h],
      Border: [0, 0, 0],
      A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
    });
    const ref = doc.context.register(annot);
    page.node.addAnnot(ref);
  };

  // intestazione
  page.drawRectangle({ x: 0, y: H - 10, width: W, height: 10, color: accent });
  page.drawText("Scheda di allenamento", { x: M, y: y - 22, size: 24, font: bold, color: ink });
  y -= 44;
  page.drawText(clean(`${input.clientName}  ·  preparata da ${input.trainerName}  ·  ${input.date}`), { x: M, y, size: 11, font: regular, color: muted });
  y -= 14;
  page.drawText("Sotto ogni esercizio trovi il link al video dell'esecuzione.", { x: M, y, size: 10, font: regular, color: muted });
  y -= 22;

  for (const day of input.days) {
    ensure(70);
    y -= 10;
    page.drawText(clean(day.focus ? `${day.label}  ·  ${day.focus}` : day.label), { x: M, y, size: 15, font: bold, color: accent });
    y -= 12;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 1, color: line });
    y -= 6;

    day.rows.forEach((r, i) => {
      ensure(r.video ? 46 : 32);
      y -= 18;
      page.drawText(`${i + 1}`, { x: M, y, size: 11, font: bold, color: muted });
      page.drawText(clean(r.name), { x: M + 22, y, size: 12, font: bold, color: ink });
      const detail = clean([r.sets, r.load !== "—" ? r.load : "", r.rest ? `recupero ${r.rest}` : ""].filter(Boolean).join("   ·   "));
      const dw = regular.widthOfTextAtSize(detail, 10.5);
      page.drawText(detail, { x: W - M - dw, y, size: 10.5, font: regular, color: ink });
      if (r.video) {
        y -= 15;
        const label = "Guarda il video dell'esecuzione  >";
        page.drawText(label, { x: M + 22, y, size: 10, font: bold, color: accent });
        link(M + 22, y - 3, bold.widthOfTextAtSize(label, 10), 14, r.video);
      }
      y -= 9;
      page.drawLine({ start: { x: M + 22, y }, end: { x: W - M, y }, thickness: 0.5, color: line });
    });
    y -= 8;
  }

  ensure(30);
  y -= 18;
  page.drawText(clean(`Per dubbi sugli esercizi scrivi a ${input.trainerName} dall'app.`), { x: M, y, size: 9.5, font: regular, color: muted });

  const bytes = await doc.save();
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}
