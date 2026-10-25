// Colore del marchio, tema e suoni: hanno già il loro sistema (AppearanceProvider, libs/ui/sound.ts).
// Lo sportello li raggiunge con un ponte che AppearanceProvider registra all'avvio; Leo cambia l'aspetto da qui.
// Con Supabase questi valori finiranno anche nel profilo del trainer (trainers.color, sounds_enabled).

import { no, OK } from "@/libs/domain/verifica";
import type { Esito } from "./sportello";

export type Tema = "light" | "dark";
type Aspetto = { colore: string; tema: Tema; suoni: boolean };
export type Ponte = { leggi(): Aspetto; setAccent(c: string): void; setTheme(t: Tema): void; setSuoni(s: boolean): void };

let ponte: Ponte | null = null;
export const registraAspetto = (p: Ponte | null) => {
  ponte = p;
};

export async function cambiaAspetto(patch: Partial<Aspetto>): Promise<Esito> {
  if (!ponte) return { ok: false, motivo: "Impostazioni non disponibili" };
  const p = ponte;
  const prima = p.leggi();
  const applica = (a: Partial<Aspetto>) => {
    if (a.colore !== undefined) p.setAccent(a.colore);
    if (a.tema !== undefined) p.setTheme(a.tema);
    if (a.suoni !== undefined) p.setSuoni(a.suoni);
  };
  applica(patch);
  return {
    ok: true,
    annulla: async () => {
      if (!ponte) return no("Impostazioni non disponibili");
      applica({ colore: patch.colore !== undefined ? prima.colore : undefined, tema: patch.tema !== undefined ? prima.tema : undefined, suoni: patch.suoni !== undefined ? prima.suoni : undefined });
      return OK;
    },
  };
}
