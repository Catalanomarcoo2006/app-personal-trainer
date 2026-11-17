"use client";

// Il logo del trainer di adesso, nella versione vera (la foto passa da stato.trainerPhoto, come nella demo):
// lo imposta AvvioVero dal database e lo cambiano le Impostazioni.

import { useSyncExternalStore } from "react";

let logo: string | null = null;
const chi = new Set<() => void>();

export function impostaLogo(url: string | null) {
  logo = url;
  chi.forEach((f) => f());
}

export const useLogo = () =>
  useSyncExternalStore(
    (f: () => void) => {
      chi.add(f);
      return () => {
        chi.delete(f);
      };
    },
    (): string | null => logo,
    (): string | null => null,
  );
