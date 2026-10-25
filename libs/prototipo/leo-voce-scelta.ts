// La scelta dei vocali ("Invia subito" o "Rivedi prima"): la fa il trainer al primo vocale e si cambia dalle Impostazioni.
// Si ricorda in questo browser (localStorage); con Supabase finirà nel profilo, accanto a colore e suoni.

import { useCallback, useSyncExternalStore } from "react";
import type { SceltaVocali } from "./leo-voce";

const CHIAVE = "leo-vocali";

type Magazzino = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const daTesto = (v: string | null): SceltaVocali => (v === "subito" || v === "rivedi" ? v : null);

// Il magazzino si legge una volta; poi vale il valore in memoria, così la scelta tiene anche se lo storage è bloccato.
export function creaArchivioScelta(magazzino?: Magazzino) {
  let valore: SceltaVocali = null;
  try {
    valore = daTesto(magazzino?.getItem(CHIAVE) ?? null);
  } catch {
    // storage non disponibile (navigazione privata)
  }
  const iscritti = new Set<() => void>();
  return {
    leggi: (): SceltaVocali => valore,
    scrivi(s: SceltaVocali) {
      valore = s;
      try {
        if (s) magazzino?.setItem(CHIAVE, s);
        else magazzino?.removeItem(CHIAVE);
      } catch {
        // vale per questa pagina
      }
      iscritti.forEach((f) => f());
    },
    iscriviti(f: () => void) {
      iscritti.add(f);
      return (): void => {
        iscritti.delete(f);
      };
    },
  };
}

type Archivio = ReturnType<typeof creaArchivioScelta>;
let archivio: Archivio | null = null;

// Nel browser si crea alla prima richiesta (anche solo accedere a window.localStorage può lanciare).
function archivioDelBrowser(): Archivio {
  if (!archivio) {
    let magazzino: Storage | undefined;
    try {
      magazzino = window.localStorage;
    } catch {
      magazzino = undefined;
    }
    archivio = creaArchivioScelta(magazzino);
  }
  return archivio;
}

export function useSceltaVocali(): [SceltaVocali, (s: SceltaVocali) => void] {
  const scelta = useSyncExternalStore(
    (f: () => void): (() => void) => archivioDelBrowser().iscriviti(f),
    () => archivioDelBrowser().leggi(),
    (): SceltaVocali => null,
  );
  const scrivi = useCallback((s: SceltaVocali): void => archivioDelBrowser().scrivi(s), []);
  return [scelta, scrivi];
}
