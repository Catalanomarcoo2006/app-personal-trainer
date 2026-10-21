"use client";

import { useParams } from "next/navigation";
import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { ClientNotFound, ClientProfile } from "@/components/prototipo/trainer/ClientProfile";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";
import { clientById } from "@/libs/prototipo/dati-finti";

// Profilo di un cliente: peso, progressi, obiettivo, misure, appuntamenti, pagamenti, domande.
export default function PrototipoProfiloCliente() {
  const { id } = useParams<{ id: string }>();
  const c = clientById(id);

  return (
    <TrainerShell title={c ? c.name : "Cliente"} back={ROUTES.clienti} titleRight={<UrgentBell />}>
      {c ? <ClientProfile key={c.id} c={c} /> : <ClientNotFound />}
    </TrainerShell>
  );
}
