"use client";

import { useEffect } from "react";
import { playSound } from "@/libs/ui/sound";

const CLICKABLE =
  'button, a[href], [role="button"], [role="tab"], [role="switch"], [role="option"], [role="menuitem"], [role="checkbox"], input[type="checkbox"], input[type="radio"], select, summary, label[for]';

// Ogni elemento cliccabile fa il "pop", anche quelli che non chiedono un suono loro.
// Ascolta in fase di risalita: i suoni specifici chiesti dai componenti nello stesso clic
// (cambio sezione, apertura, conferma) hanno la precedenza, vedi playSound.
export function ClickSound(): null {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.(CLICKABLE);
      if (!el || (el as HTMLButtonElement).disabled || el.getAttribute("aria-disabled") === "true") return;
      playSound("tap");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
