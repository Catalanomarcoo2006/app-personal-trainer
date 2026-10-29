// I dati dei clienti nella stessa forma delle tabelle del database (piano v1, Task 3), in camelCase:
// importi in centesimi, pacchetti a lezioni o a tempo, misure come righe datate.
// Oggi vivono nello store del prototipo; con Supabase arriveranno dalle tabelle senza traduzioni.

import type { PackageKind } from "@/libs/domain/packages";
import type { Tone } from "@/libs/prototipo/dati-finti";
import type { Frequenza } from "@/libs/domain/pesate";

export type ClienteDati = {
  id: string;
  name: string;
  gender: "donna" | "uomo";
  initials: string;
  photo?: string;
  tone: Tone;
  since: string;
  goalLabel: string;
  goalUnit: string;
  goalStart: number;
  goalCurrent: number;
  goalTarget: number;
  notes: string;
  lastWorkout: string;
  needsAttention: boolean;
  plan: string;
  questions: string[];
  email?: string;
  phone?: string;
  // dall'app del cliente: ogni quanto si pesa, e l'obiettivo che ha proposto alla registrazione (lo conferma il trainer)
  pesata?: Frequenza;
  obiettivoProposto?: { start: number; target: number };
};

export type Pacchetto = {
  id: string;
  clientId: string;
  kind: PackageKind;
  label: string;
  lessonsTotal: number | null;
  lessonsUsed: number; // nel database si contano le sedute fatte (lessonsRemaining)
  startsOn: string;
  endsOn: string | null;
  priceCents: number;
};

export type Pagamento = {
  id: string;
  clientId: string;
  packageId: string | null;
  description: string;
  amountCents: number;
  dueOn: string;
  paidOn: string | null; // vuoto = da incassare
};

export type Misura = {
  id: string;
  clientId: string;
  takenOn: string;
  weightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  daConfermare?: boolean; // circonferenze scritte dal cliente: valgono quando il trainer le accetta
};

export type Notifiche = { dolore: boolean; spostamento: boolean; pacchetti: boolean; riepilogo: boolean; avvisoDolori: boolean };

export type DatiClienti = { clienti: ClienteDati[]; pacchetti: Pacchetto[]; pagamenti: Pagamento[]; misure: Misura[]; notifiche: Notifiche };
