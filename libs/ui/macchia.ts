import { formeOnda } from "@/libs/ui/onda";

// Transizione "a macchia d'olio": il nuovo aspetto della pagina si allarga con una macchia irregolare
// che parte dal punto indicato (cambio tema, link di Leo). La forma della macchia è in app/globals.css
// (::view-transition-new(root)). Senza View Transitions o con "riduci movimento" la pagina cambia e basta.
export function conMacchia(aggiorna: () => void | Promise<void>, origine?: { x: number; y: number }, durata = 900): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    void aggiorna();
    return;
  }

  const x = origine?.x ?? window.innerWidth / 2;
  const y = origine?.y ?? window.innerHeight / 2;
  const reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const end = reach * 3.2; // la macchia non è un cerchio: serve margine per coprire gli angoli
  const transition = document.startViewTransition(aggiorna);
  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          maskSize: ["0px 0px", `${end * 0.18}px ${end * 0.18}px`, `${end}px ${end}px`],
          maskPosition: [`${x}px ${y}px`, `${x - end * 0.09}px ${y - end * 0.09}px`, `${x - end / 2}px ${y - end / 2}px`],
        },
        // "forwards": a fine animazione la maschera resta enorme; senza, per un istante tornava piccola
        // e ricompariva una macchia sopra la pagina nuova.
        { duration: durata, easing: "cubic-bezier(0.7, 0, 0.3, 1)", fill: "forwards", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {
      // transizione saltata (per esempio un'altra è partita subito dopo): la pagina è già aggiornata
    });
}

// Cambio tema: come conMacchia, ma con l'onda del video di riferimento (libs/ui/onda.ts). La classe "onda" su <html>
// spegne la maschera tonda di globals.css finché l'onda è in corso. Senza clip-path: path() torna la macchia.
export function conOnda(aggiorna: () => void | Promise<void>, origine?: { x: number; y: number }, durata = 630): void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    void aggiorna();
    return;
  }
  if (!CSS.supports("clip-path", "path('M 0 0 L 1 1 Z')")) {
    conMacchia(aggiorna, origine);
    return;
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const forme = formeOnda(w, h, origine ?? { x: w / 2, y: h / 2 });
  const html = document.documentElement;
  html.classList.add("onda");
  const transition = document.startViewTransition(aggiorna);
  transition.ready
    .then(() => {
      html.animate(
        { clipPath: forme },
        { duration: durata, easing: "linear", fill: "forwards", pseudoElement: "::view-transition-new(root)" },
      );
    })
    .catch(() => {});
  transition.finished.finally(() => html.classList.remove("onda"));
}
