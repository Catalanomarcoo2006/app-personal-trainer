// Pacchetti: a lezioni (si scalano le sedute fatte) o a tempo (valgono fino a una data).

import { daysBetween } from "./time";

export type PackageKind = "lessons" | "time";
export type SessionStatus = "scheduled" | "done" | "cancelled";

type Session = { id: string; status: SessionStatus };

const EXPIRING_LESSONS = 2; // con 2 lezioni rimaste o meno è il momento del rinnovo
const EXPIRING_DAYS = 7; // a tempo: quando mancano 7 giorni o meno

// Lezioni rimaste: contano solo le sedute fatte, una volta sola anche se segnate due volte.
// Per i pacchetti a tempo non ha senso: null.
export function lessonsRemaining(pkg: { kind: PackageKind; lessons_total: number | null }, sessions: Session[]): number | null {
  if (pkg.kind !== "lessons" || pkg.lessons_total == null) return null;
  const done = new Set(sessions.filter((s) => s.status === "done").map((s) => s.id));
  return Math.max(0, pkg.lessons_total - done.size);
}

export function isPackageExpiring(
  pkg: { kind: PackageKind; lessons_total: number | null; ends_on: string | null },
  sessions: Session[],
  today: Date,
): boolean {
  const left = lessonsRemaining(pkg, sessions);
  if (left != null && left <= EXPIRING_LESSONS) return true;
  return pkg.ends_on != null && daysBetween(today, pkg.ends_on) <= EXPIRING_DAYS;
}
