"use client";

import { Suspense } from "react";
import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { PlansView } from "@/components/prototipo/trainer/Plans";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";

export default function PrototipoSchede() {
  return (
    <TrainerShell title="Schede di allenamento" back={ROUTES.oggi} titleRight={<UrgentBell />}>
      <Suspense>
        <PlansView />
      </Suspense>
    </TrainerShell>
  );
}
