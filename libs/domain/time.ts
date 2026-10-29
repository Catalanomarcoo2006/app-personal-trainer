// Date e mesi nel fuso italiano: un pagamento delle 23:30 del 31 gennaio conta in gennaio,
// anche se in UTC è già febbraio. Nessuna libreria: basta Intl.

const TZ = "Europe/Rome";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// "AAAA-MM-GG" del giorno in Italia. Una data senza ora ("2027-03-31") è già un giorno di calendario.
export function romeDayKey(date: Date | string): string {
  if (typeof date === "string" && DATE_ONLY.test(date)) return date;
  return dayFormat.format(typeof date === "string" ? new Date(date) : date);
}

// "AAAA-MM" del mese in Italia.
export function romeMonthKey(date: Date | string): string {
  return romeDayKey(date).slice(0, 7);
}

// Giorni di calendario da `from` a `to` (negativo se `to` è prima), contati sul calendario italiano.
export function daysBetween(from: Date | string, to: Date | string): number {
  const utc = (key: string) => Date.UTC(+key.slice(0, 4), +key.slice(5, 7) - 1, +key.slice(8, 10));
  return Math.round((utc(romeDayKey(to)) - utc(romeDayKey(from))) / 86_400_000);
}

// "2026-10-31" + 1 mese → "2026-11-30": l'ultimo del mese resta l'ultimo del mese.
export function aggiungiMesi(iso: string, mesi: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const fineMese = (yy: number, mm: number) => new Date(Date.UTC(yy, mm, 0)).getUTCDate(); // mm 1-12
  const totale = m - 1 + mesi;
  const ny = y + Math.floor(totale / 12);
  const nm = (totale % 12) + 1;
  const giorno = d === fineMese(y, m) ? fineMese(ny, nm) : Math.min(d, fineMese(ny, nm));
  return `${ny}-${String(nm).padStart(2, "0")}-${String(giorno).padStart(2, "0")}`;
}
