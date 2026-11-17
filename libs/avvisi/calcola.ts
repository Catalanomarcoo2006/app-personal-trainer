// Avvisi al trainer, la parte pura (la provano i test): quali pacchetti stanno finendo, quali avvisi partono per
// email secondo le sue notifiche, il riepilogo della settimana. Il giro che legge e scrive è in giro.ts.

import type { Tables } from "@/types/db";
import type { Notifiche } from "@/libs/dati/tipi";
import { isPackageExpiring } from "@/libs/domain/packages";
import { daysBetween, romeDayKey } from "@/libs/domain/time";
import { pacchettoDa, dataRoma } from "@/libs/vera/mappa";
import { dataLunga } from "@/libs/vera/account";

type Pacchetto = Tables<"packages">;
type Seduta = Tables<"sessions">;
type Avviso = Tables<"alerts">;

export type AvvisoPacchetto = { packageId: string; clientId: string; testo: string };

const lezioni = (n: number) => (n === 1 ? "1 lezione" : `${n} lezioni`);

// Il pacchetto di adesso di ogni cliente (l'ultimo iniziato): se sta finendo e non è già stato avvisato, un avviso.
export function pacchettiDaAvvisare(
  r: { clients: Pick<Tables<"clients">, "id" | "name">[]; packages: Pacchetto[]; sessions: Seduta[]; giaAvvisati: Set<string> },
  adesso: Date,
): AvvisoPacchetto[] {
  const oggi = romeDayKey(adesso);
  return r.clients.flatMap((c) => {
    const ultimo = r.packages
      .filter((p) => p.client_id === c.id && p.starts_on <= oggi)
      .sort((a, b) => b.starts_on.localeCompare(a.starts_on) || b.created_at.localeCompare(a.created_at))[0];
    if (!ultimo || r.giaAvvisati.has(ultimo.id)) return [];
    const p = pacchettoDa(ultimo, r.sessions, adesso);
    const fatte = Array.from({ length: p.lessonsUsed }, (_, i) => ({ id: `s${i}`, status: "done" as const }));
    if (!isPackageExpiring({ kind: ultimo.kind, lessons_total: ultimo.lessons_total, ends_on: ultimo.ends_on }, fatte, adesso)) return [];
    const nome = c.name.split(" ")[0];
    let testo: string;
    if (ultimo.kind === "lessons") {
      const restano = Math.max(0, (ultimo.lessons_total ?? 0) - p.lessonsUsed);
      testo = restano === 0 ? `${nome} ha finito le lezioni del pacchetto` : `A ${nome} ${restano === 1 ? "resta" : "restano"} ${lezioni(restano)} del pacchetto`;
    } else {
      const giorni = daysBetween(adesso, ultimo.ends_on!);
      testo = giorni < 0 ? `Il pacchetto di ${nome} è scaduto il ${dataLunga(ultimo.ends_on!)}` : giorni === 0 ? `Il pacchetto di ${nome} scade oggi` : `Il pacchetto di ${nome} scade il ${dataLunga(ultimo.ends_on!)}`;
    }
    return [{ packageId: ultimo.id, clientId: c.id, testo }];
  });
}

const NOTIFICA: Record<Avviso["kind"], keyof Notifiche> = { pain: "dolore", change_request: "spostamento", package_expiring: "pacchetti" };
const GIORNI_EMAIL = 3; // gli avvisi più vecchi non partono più (per esempio se Resend arriva dopo)

// Degli avvisi non ancora mandati: quali vanno nell'email e quali si chiudono senza email (notifica spenta o vecchi).
export function avvisiDaMandare(avvisi: Avviso[], notifiche: Partial<Notifiche>, adesso: Date): { email: Avviso[]; chiudi: Avviso[] } {
  const email: Avviso[] = [];
  const chiudi: Avviso[] = [];
  for (const a of avvisi.filter((x) => !x.emailed_at)) {
    const recente = daysBetween(a.created_at, adesso) <= GIORNI_EMAIL;
    (notifiche[NOTIFICA[a.kind]] !== false && recente ? email : chiudi).push(a);
  }
  return { email, chiudi };
}

export function rigaAvviso(a: Pick<Avviso, "kind" | "text" | "client_id">, nomi: Map<string, string>): string {
  const nome = (a.client_id && nomi.get(a.client_id)) || "Un cliente";
  if (a.kind === "pain") return `${nome} ha segnalato un dolore: "${a.text}"`;
  if (a.kind === "change_request") return `${nome} chiede di spostare una seduta: "${a.text}"`;
  return a.text;
}

// "Lunedì 17/11": la settimana scorsa (lunedì-domenica) e quella che inizia.
export function riepilogoSettimana(r: { payments: Tables<"payments">[]; sessions: Seduta[] }, adesso: Date): string[] {
  const oggi = romeDayKey(adesso);
  const piu = (n: number) => romeDayKey(new Date(new Date(`${oggi}T12:00:00Z`).getTime() + n * 86_400_000));
  const da = piu(-7);
  const fino = piu(-1);
  const euro = (cent: number) => `${(cent / 100).toLocaleString("it-IT", { minimumFractionDigits: cent % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;
  const incassato = r.payments.filter((p) => p.paid_on && p.paid_on >= da && p.paid_on <= fino).reduce((s, p) => s + p.amount_cents, 0);
  const daIncassare = r.payments.filter((p) => !p.paid_on).reduce((s, p) => s + p.amount_cents, 0);
  const valide = r.sessions.filter((s) => s.status !== "cancelled");
  const fatte = valide.filter((s) => dataRoma(s.starts_at) >= da && dataRoma(s.starts_at) <= fino).length;
  const prossime = valide.filter((s) => dataRoma(s.starts_at) >= oggi && dataRoma(s.starts_at) <= piu(6)).length;
  const sedute = (n: number) => (n === 1 ? "1 seduta" : `${n} sedute`);
  return [
    `La settimana scorsa: ${sedute(fatte)} e ${euro(incassato)} incassati.`,
    `Questa settimana: ${sedute(prossime)} in calendario.`,
    daIncassare ? `Da incassare in tutto: ${euro(daIncassare)}.` : "Nessun pagamento da incassare.",
  ];
}

// Lunedì in Italia?
export const eLunedi = (adesso: Date) => new Date(`${romeDayKey(adesso)}T12:00:00Z`).getUTCDay() === 1;
