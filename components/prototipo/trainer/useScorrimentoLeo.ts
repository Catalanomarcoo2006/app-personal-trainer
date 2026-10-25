"use client";

// Lo scorrimento della chat di Leo: con più azioni insieme porta in cima alla prima e poi segue quella in corso;
// "sotto" dice quante schede restano fuori vista in basso e "piuSotto" se c'è comunque altro da vedere (richiamo "altre azioni sotto"). Regola in libs/prototipo/leo-scorrimento.ts.

import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { bersaglioScorrimento } from "@/libs/prototipo/leo-scorrimento";

type Messaggio = { id: number; schede?: { key: string; stato: string }[] };

const MARGINE = 10;

export function useScorrimentoLeo(scroller: RefObject<HTMLDivElement | null>, messaggi: Messaggio[], typing: boolean) {
  const [sotto, setSotto] = useState(0);
  const [piuSotto, setPiuSotto] = useState(false);
  const ultimaChiave = useRef<string | null>(null);

  // quante schede dell'ultimo messaggio sono ancora (anche solo in parte) fuori vista in basso
  const aggiorna = useCallback(() => {
    const sc = scroller.current;
    if (!sc) return;
    const ultimo = messaggi[messaggi.length - 1];
    if (!ultimo?.schede || ultimo.schede.length < 2) {
      setSotto(0);
      setPiuSotto(false);
      return;
    }
    // c'è altro in basso (una scheda tagliata, "Conferma tutte") anche quando nessuna scheda è del tutto nascosta
    setPiuSotto(sc.scrollHeight - sc.scrollTop - sc.clientHeight > 24);
    const limite = sc.getBoundingClientRect().bottom - 24;
    const fuori = ultimo.schede.filter((s) => {
      const el = sc.querySelector(`[data-scheda="${s.key}"]`);
      return el ? el.getBoundingClientRect().top > limite : false;
    });
    setSotto(fuori.length);
  }, [scroller, messaggi]);

  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    const b = bersaglioScorrimento(messaggi);
    if (!b) {
      ultimaChiave.current = null;
      sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
    } else if (b.chiave !== ultimaChiave.current) {
      ultimaChiave.current = b.chiave;
      const el = sc.querySelector(b.cosa.tipo === "messaggio" ? `[data-msg="${b.cosa.id}"]` : `[data-scheda="${b.cosa.key}"]`);
      if (el) sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - MARGINE, behavior: "smooth" });
    }
    const t = window.setTimeout(aggiorna, 450); // dopo l'animazione di comparsa e lo scorrimento
    return () => window.clearTimeout(t);
  }, [messaggi, typing, scroller, aggiorna]);

  // porta alla prima scheda ancora fuori vista, o in fondo se sono tutte in vista ma c'è altro (Conferma tutte)
  const vaiSotto = useCallback(() => {
    const sc = scroller.current;
    const ultimo = messaggi[messaggi.length - 1];
    if (!sc || !ultimo?.schede) return;
    const limite = sc.getBoundingClientRect().bottom - 24;
    for (const s of ultimo.schede) {
      const el = sc.querySelector(`[data-scheda="${s.key}"]`);
      if (el && el.getBoundingClientRect().top > limite) {
        sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - MARGINE, behavior: "smooth" });
        return;
      }
    }
    sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" });
  }, [scroller, messaggi]);

  return { sotto, piuSotto, aggiorna, vaiSotto };
}
