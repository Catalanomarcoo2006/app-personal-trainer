// Aprire un file in una scheda nuova del browser: un PDF della demo, un file caricato (Blob) o un PDF da generare.
// La scheda si apre subito, nello stesso tocco: aperta dopo un'attesa (la generazione del PDF) la bloccherebbe il browser.

import { oggi } from "@/libs/orologio";
import { buildPlanPdf } from "@/libs/prototipo/pdf-invio";
import { clients, trainer } from "@/libs/prototipo/dati-finti";
import type { Day } from "@/libs/prototipo/stato";
import { rowName, rowVideo } from "@/libs/prototipo/stato";
import { CLIENTE_IO } from "./scheda";

export async function apriFile(file: Blob | string | (() => Promise<Blob>)): Promise<boolean> {
  if (typeof file === "string") return !!window.open(file, "_blank", "noopener");
  const finestra = window.open("", "_blank");
  try {
    const blob = typeof file === "function" ? await file() : file;
    const url = URL.createObjectURL(blob);
    if (finestra) finestra.location.href = url;
    else window.location.href = url;
    return true;
  } catch (e) {
    finestra?.close();
    console.error("File non aperto", e);
    return false;
  }
}

// La scheda intera in PDF, come quella che Marco manda dall'area trainer (pdf-invio.ts), con il colore del trainer.
export function pdfScheda(giorni: Day[], videos: Record<string, string>): () => Promise<Blob> {
  return () => {
    const colore = getComputedStyle(document.documentElement).getPropertyValue("--trainer").trim();
    return buildPlanPdf({
      clientName: clients.find((c) => c.id === CLIENTE_IO)?.name ?? "",
      trainerName: trainer.name,
      date: `${trainer.today.toLowerCase()} ${oggi().slice(0, 4)}`,
      color: /^#[0-9a-f]{6}$/i.test(colore) ? colore : trainer.color,
      days: giorni.map((g) => ({ label: g.label, focus: g.focus, rows: g.rows.map((r) => ({ name: rowName(r), sets: r.sets, load: r.load, rest: r.rest, video: rowVideo(r, videos) })) })),
    });
  };
}
