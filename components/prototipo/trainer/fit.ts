"use client";

import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";

// Densità che si adatta allo spazio: se un contenitore marcato con data-fit non riesce a mostrare tutto,
// passa al livello successivo (più compatto) prima che il browser disegni. Niente tagli, niente scorrimento.
// Riparte dal livello 0 quando cambiano i dati (deps) o l'altezza disponibile.
export function useFitDensity(ref: RefObject<HTMLElement | null>, max: number, deps: unknown[]) {
  const [level, setLevel] = useState(0);
  const [height, setHeight] = useState(0);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // altezza 0 = sezione nascosta: si tiene la misura di prima, così tornandoci non cambia nulla
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height);
      if (h > 0) setHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  const key = JSON.stringify([height, ...deps]);

  useLayoutEffect(() => {
    if (key !== lastKey.current) {
      lastKey.current = key;
      if (level !== 0) {
        setLevel(0);
        return;
      }
    }
    const el = ref.current;
    if (!el || level >= max || el.clientHeight === 0) return;
    const boxes = el.hasAttribute("data-fit") ? [el] : Array.from(el.querySelectorAll<HTMLElement>("[data-fit]"));
    if (boxes.some(overflows)) setLevel(level + 1);
  });

  return level;
}

// Conta solo gli elementi al loro posto: quelli che stanno uscendo con un'animazione
// (messi in posizione assoluta) non devono far credere che manchi spazio.
function overflows(box: HTMLElement) {
  const inFlow = Array.from(box.children).filter((ch): ch is HTMLElement => ch instanceof HTMLElement && getComputedStyle(ch).position !== "absolute");
  if (!inFlow.length) return false;
  const bottom = Math.max(...inFlow.map((ch) => ch.offsetTop + ch.offsetHeight));
  const padBottom = parseFloat(getComputedStyle(box).paddingBottom) || 0;
  return bottom > box.clientHeight - padBottom + 1;
}
