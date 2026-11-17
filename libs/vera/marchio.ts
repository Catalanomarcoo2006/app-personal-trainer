// Foto e logo del trainer su Storage (bucket pubblico "marchi", migrazione 7): percorsi e indirizzi. Funzioni pure,
// usate anche sul server (caricamento, pagina /<slug>). Il logo di adesso per le pagine è in logo.ts.
// Un file per immagine in <trainer>/<foto|logo>-<numero>.<ext>: il nome cambia a ogni caricamento, così il browser
// e la rete non mostrano quella vecchia.

export const BUCKET_MARCHI = "marchi";

export function percorsoMarchio(trainerId: string, tipo: "foto" | "logo", ora = Date.now()): string {
  return `${trainerId}/${tipo}-${ora}.${tipo === "foto" ? "jpg" : "png"}`;
}

// L'indirizzo pubblico del file: si legge anche senza accesso (pagina /<slug> prima del login).
export function indirizzoMarchio(percorso: string | null | undefined, base = process.env.NEXT_PUBLIC_SUPABASE_URL): string | undefined {
  if (!percorso || !base) return undefined;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_MARCHI}/${percorso.split("/").map(encodeURIComponent).join("/")}`;
}

// Da un'immagine già preparata nel browser (data URL di canvas) al file da caricare.
export async function fileDa(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
