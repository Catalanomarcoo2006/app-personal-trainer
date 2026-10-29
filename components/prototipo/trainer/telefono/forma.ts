"use client";

// Quale area trainer mostrare: quella da computer (la tela larga) o quella da telefono (Marco, 29/10: Oggi, Clienti,
// Messaggi, Calendario e Leo; niente Incassi né Schede). Sul telefono vero si sceglie dalla larghezza dello schermo.
// Per provarla dal computer: ?telefono nell'indirizzo; ?computer torna alla tela larga. La scelta resta finché la
// scheda del browser è aperta (sessionStorage), così cambiando sezione non si perde.

import { useEffect, useState } from "react";

export type Forma = "telefono" | "computer";

const CHIAVE = "pt-trainer-forma";
const TELEFONO = "(max-width: 700px)";

function scelta(): Forma | null {
  const q = new URLSearchParams(window.location.search);
  try {
    if (q.has("telefono")) sessionStorage.setItem(CHIAVE, "telefono");
    if (q.has("computer")) sessionStorage.setItem(CHIAVE, "computer");
    const s = sessionStorage.getItem(CHIAVE);
    return s === "telefono" || s === "computer" ? s : null;
  } catch {
    return q.has("telefono") ? "telefono" : q.has("computer") ? "computer" : null;
  }
}

// null finché non si è letto il browser (al primo disegno sul server non si sa).
export function useForma(): Forma | null {
  const [forma, setForma] = useState<Forma | null>(null);
  useEffect(() => {
    const fissa = scelta();
    if (fissa) return setForma(fissa);
    const mq = window.matchMedia(TELEFONO);
    const segui = () => setForma(mq.matches ? "telefono" : "computer");
    segui();
    mq.addEventListener("change", segui);
    return () => mq.removeEventListener("change", segui);
  }, []);
  return forma;
}

// Dal foglio dell'account: passa all'altra versione e ricarica.
export function passaA(forma: Forma) {
  try {
    sessionStorage.setItem(CHIAVE, forma);
  } catch {
    // senza archivio del browser vale l'indirizzo
  }
  window.location.assign(`${window.location.pathname}?${forma}`);
}
