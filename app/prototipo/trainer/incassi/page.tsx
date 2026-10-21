"use client";

import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { PaymentsView } from "@/components/prototipo/trainer/Payments";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";

export default function PrototipoIncassi() {
  return (
    <TrainerShell title="Incassi" back={ROUTES.oggi} titleRight={<UrgentBell />}>
      <PaymentsView />
    </TrainerShell>
  );
}
