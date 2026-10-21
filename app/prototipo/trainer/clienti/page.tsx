"use client";

import { Suspense } from "react";
import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { ClientList } from "@/components/prototipo/trainer/ClientList";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";

// Lista dei clienti del trainer: ogni scheda apre il profilo del cliente.
export default function PrototipoClienti() {
  return (
    <TrainerShell title="I tuoi clienti" back={ROUTES.oggi} titleRight={<UrgentBell />}>
      <Suspense>
        <ClientList />
      </Suspense>
    </TrainerShell>
  );
}
