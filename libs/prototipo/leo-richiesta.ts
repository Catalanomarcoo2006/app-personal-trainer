// Il corpo della domanda a Leo: la conversazione più la situazione di adesso (calendario, clienti senza email
// e telefoni, incassi, aspetto, notifiche), presa dallo store del browser.

import { calcolaIncassi } from "@/libs/dati/selettori";
import { perContesto, type ExtraContesto } from "./leo-contesto";
import { stato } from "./stato";

type Turno = { role: "user" | "assistant"; content: string };

export function corpoRichiesta(messages: Turno[], aspetto?: ExtraContesto["aspetto"]) {
  const { sedute, dati } = stato.get();
  const incassi = calcolaIncassi(dati);
  return {
    messages,
    calendario: sedute,
    clienti: perContesto(dati),
    extra: {
      incassi: { incassatoCents: incassi.collectedCents, daIncassareCents: incassi.outstandingCents },
      notifiche: dati.notifiche,
      ...(aspetto ? { aspetto } : {}),
    },
  };
}

// Colore e tema come li vede il trainer adesso (dal documento).
export function aspettoAttuale(): ExtraContesto["aspetto"] | undefined {
  if (typeof document === "undefined") return undefined;
  const radice = document.documentElement;
  const colore = getComputedStyle(radice).getPropertyValue("--trainer").trim();
  return { colore: /^#[0-9a-f]{3,8}$/i.test(colore) ? colore : "#ff6b2c", tema: radice.classList.contains("dark") ? "dark" : "light" };
}
