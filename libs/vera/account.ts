// L'account del trainer nella versione vera (Impostazioni): email d'accesso, slug della pagina dei clienti e
// scadenza della licenza. Li imposta AvvioVero prima che le pagine si disegnino; nella demo restano vuoti e le
// Impostazioni mostrano i dati finti. Qui anche il conto della licenza (puro, lo provano i test).

import { daysBetween } from "@/libs/domain/time";

export type AccountVero = { email: string; slug: string; licenza: string };

let account: AccountVero | null = null;
export const impostaAccount = (a: AccountVero | null) => {
  account = a;
};
export const accountVero = () => account;

const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];

// "2027-10-21" → "21 ottobre 2027"
export const dataLunga = (iso: string) => `${Number(iso.slice(8, 10))} ${MESI[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

// La licenza dura un anno: quanto ne è passato (la barra), quanti giorni restano, se è ora di rinnovare (30 giorni).
export function statoLicenza(scadenza: string, oggi: string): { data: string; giorni: number; passato: number; inScadenza: boolean; scaduta: boolean } {
  const giorni = daysBetween(oggi, scadenza);
  const passato = Math.round(Math.min(100, Math.max(0, ((365 - giorni) / 365) * 100)));
  return { data: dataLunga(scadenza), giorni, passato, inScadenza: giorni >= 0 && giorni <= 30, scaduta: giorni < 0 };
}
