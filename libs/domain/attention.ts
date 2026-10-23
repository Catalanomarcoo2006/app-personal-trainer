// Clienti da seguire: nessun allenamento da una settimana o più (o mai).

import { daysBetween } from "./time";

const IDLE_DAYS = 7;

export function needsAttention(lastWorkoutAt: Date | null, today: Date): boolean {
  return lastWorkoutAt == null || daysBetween(lastWorkoutAt, today) >= IDLE_DAYS;
}
