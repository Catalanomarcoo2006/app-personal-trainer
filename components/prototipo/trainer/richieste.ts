// Richieste dalla barra in alto (azioni rapide) a parti dell'app che non si conoscono: il calendario apre
// la finestra "Nuova seduta", la chat di Leo si apre con una frase già scritta.

const NUOVA_SEDUTA = "nuova-seduta";
const APRI_LEO = "apri-leo";

// Il calendario può non essere ancora nella pagina quando parte la richiesta: resta in attesa finché la prende.
let sedutaInAttesa = false;

export function chiediNuovaSeduta(): void {
  sedutaInAttesa = true;
  window.dispatchEvent(new Event(NUOVA_SEDUTA));
}

// Il calendario la chiama all'avvio e a ogni richiesta: vero una volta sola per richiesta.
export function prendiNuovaSeduta(): boolean {
  const c = sedutaInAttesa;
  sedutaInAttesa = false;
  return c;
}

export function onNuovaSeduta(fn: () => void): () => void {
  window.addEventListener(NUOVA_SEDUTA, fn);
  return () => window.removeEventListener(NUOVA_SEDUTA, fn);
}

export function apriLeo(bozza: string): void {
  window.dispatchEvent(new CustomEvent<string>(APRI_LEO, { detail: bozza }));
}

export function onApriLeo(fn: (bozza: string) => void): () => void {
  const h = (e: Event) => fn((e as CustomEvent<string>).detail);
  window.addEventListener(APRI_LEO, h);
  return () => window.removeEventListener(APRI_LEO, h);
}
