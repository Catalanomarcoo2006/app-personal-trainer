"use client";

import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { WeekCalendar } from "@/components/prototipo/trainer/WeekCalendar";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";

export default function PrototipoCalendario() {
  return (
    <TrainerShell title="Calendario" back={ROUTES.oggi} titleRight={<UrgentBell />}>
      <WeekCalendar />
    </TrainerShell>
  );
}
