// Caricare e togliere un documento, dal cliente (Profilo) o dal trainer (scheda del cliente). Nella demo resta nello
// stato della finestra; nella versione vera prima va su Storage e nel database (eventiVeri), poi compare.

import { stato } from "./stato";
import { controllaFile, rimpicciolisciFoto, type Documento } from "./documenti";
import { oggi as giornoDiOggi } from "@/libs/orologio";
import { eventiVeri } from "@/libs/vera/eventi";

type Esito = { ok: true; doc: Documento } | { ok: false; motivo: string };

export async function caricaDocumento(f: File, clientId: string, da: Documento["da"]): Promise<Esito> {
  const v = controllaFile(f);
  if ("motivo" in v) return { ok: false, motivo: v.motivo };
  let file: Blob;
  try {
    file = v.tipo === "foto" ? await rimpicciolisciFoto(f) : f;
  } catch {
    return { ok: false, motivo: "Non riesco a leggere questa foto: prova con una JPG o PNG" };
  }
  const nome = v.tipo === "foto" ? f.name.replace(/\.\w+$/, ".jpg") : f.name;
  let id: string | undefined;
  let percorso: string | undefined;
  if (eventiVeri.caricaDocumento) {
    id = crypto.randomUUID();
    const p = await eventiVeri.caricaDocumento({ id, clientId, nome, tipo: v.tipo, da, file });
    if (!p) return { ok: false, motivo: "Il documento non è stato caricato: controlla la connessione e riprova" };
    percorso = p;
  }
  const doc = stato.addDocumento({ id, clientId, nome, tipo: v.tipo, da, data: giornoDiOggi(), file, ...(percorso ? { percorso } : {}) });
  return { ok: true, doc };
}

export async function togliDocumento(d: Documento): Promise<{ ok: true } | { ok: false; motivo: string }> {
  if (eventiVeri.togliDocumento && !(await eventiVeri.togliDocumento({ id: d.id, percorso: d.percorso })))
    return { ok: false, motivo: "Il documento non è stato tolto: riprova" };
  stato.removeDocumento(d.id);
  return { ok: true };
}
