// Indirizzi dell'area trainer e navigazione istantanea.
// Tutta l'area è una pagina sola: cambiare sezione aggiorna solo l'indirizzo (history.pushState, che Next
// collega a usePathname e useSearchParams), senza richieste al server.

import { conMacchia } from "@/libs/ui/macchia";
import { playSound } from "@/libs/ui/sound";

// /prototipo/trainer nella demo, /dashboard nella versione vera (impostaBase, all'avvio): chi importa BASE e ROUTES
// legge sempre l'indirizzo di adesso.
export let BASE = "/prototipo/trainer";
export function impostaBase(base: string) {
  BASE = base;
}

export const ROUTES = {
  get oggi() {
    return BASE;
  },
  get clienti() {
    return `${BASE}/clienti`;
  },
  cliente: (id: string) => `${BASE}/clienti/${id}`,
  get messaggi() {
    return `${BASE}/messaggi`;
  },
  get schede() {
    return `${BASE}/schede`;
  },
  get calendario() {
    return `${BASE}/calendario`;
  },
  get incassi() {
    return `${BASE}/incassi`;
  },
  get impostazioni() {
    return `${BASE}/impostazioni`;
  },
};

export function navigate(href: string, { quiet = false } = {}) {
  const url = new URL(href, window.location.href);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  // cambio di sezione: il doppio pop che sale (solo filtri o parametri diversi: il pop normale del clic)
  if (!quiet && url.pathname !== window.location.pathname) playSound("nav");
  window.history.pushState(null, "", url.pathname + url.search);
}

// Come navigate, ma la nuova sezione si allarga a macchia d'olio dal punto toccato (link di Leo).
// before: quello che va fatto nella pagina nuova prima di mostrarla (per esempio chiudere la chat).
export function navigateWithStain(href: string, origin: { x: number; y: number }, before?: () => void) {
  const path = new URL(href, window.location.href).pathname;
  // il suono parte subito, nello stesso clic (vince sul pop generico); la sezione cambia un fotogramma dopo
  if (path !== window.location.pathname) playSound("nav");
  conMacchia(
    () => {
      before?.();
      navigate(href, { quiet: true });
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

// Cambio di sezione con una dissolvenza veloce (viaggio di Leo): la sezione attuale sfuma, compare la nuova.
// Risolve quando la sezione nuova è visibile. Con "riduci movimento" il cambio è immediato.
export async function navigateFade(href: string): Promise<void> {
  const url = new URL(href, window.location.href);
  if (url.pathname + url.search === window.location.pathname + window.location.search) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const live = () => document.querySelector<HTMLElement>("[data-sezione].section-live");
  const before = live();
  // fill: la sezione vecchia resta trasparente finché non è nascosta, senza lampi
  const out = before && !reduce && url.pathname !== window.location.pathname ? before.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: "ease-out", fill: "forwards" }) : null;
  await out?.finished.catch(() => {});
  navigate(href);
  await sectionShown(url.pathname);
  out?.cancel();
  const after = live();
  if (after && !reduce && after !== before) await after.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: "ease-out" }).finished.catch(() => {});
}
