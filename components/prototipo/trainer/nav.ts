// Indirizzi dell'area trainer e navigazione istantanea.
// Tutta l'area è una pagina sola: cambiare sezione aggiorna solo l'indirizzo (history.pushState, che Next
// collega a usePathname e useSearchParams), senza richieste al server.

import { conMacchia } from "@/libs/ui/macchia";

export const BASE = "/prototipo/trainer";

export const ROUTES = {
  oggi: BASE,
  clienti: `${BASE}/clienti`,
  cliente: (id: string) => `${BASE}/clienti/${id}`,
  messaggi: `${BASE}/messaggi`,
  schede: `${BASE}/schede`,
  calendario: `${BASE}/calendario`,
  incassi: `${BASE}/incassi`,
  impostazioni: `${BASE}/impostazioni`,
};

export function navigate(href: string) {
  const url = new URL(href, window.location.href);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  window.history.pushState(null, "", url.pathname + url.search);
}

// Come navigate, ma la nuova sezione si allarga a macchia d'olio dal punto toccato (link di Leo).
// before: quello che va fatto nella pagina nuova prima di mostrarla (per esempio chiudere la chat).
export function navigateWithStain(href: string, origin: { x: number; y: number }, before?: () => void) {
  const path = new URL(href, window.location.href).pathname;
  conMacchia(
    () => {
      before?.();
      navigate(href);
      return sectionShown(path);
    },
    origin,
    800,
  );
}

// Aspetta che la sezione sia nella pagina e visibile (TrainerApp le marca con data-sezione), al massimo 600 ms:
// la macchia deve scoprire la sezione nuova, non quella vecchia.
function sectionShown(path: string): Promise<void> {
  return new Promise((resolve) => {
    const ready = () => document.querySelector(`[data-sezione="${CSS.escape(path)}"].section-live`);
    if (ready()) return resolve();
    const done = () => {
      observer.disconnect();
      window.clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (ready()) done();
    });
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    const timer = window.setTimeout(done, 600);
  });
}
