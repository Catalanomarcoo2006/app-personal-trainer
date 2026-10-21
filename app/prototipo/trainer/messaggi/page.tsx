"use client";

import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { MessagesView } from "@/components/prototipo/trainer/Messages";
import { UrgentBell } from "@/components/prototipo/trainer/Urgent";

export default function PrototipoMessaggi() {
  return (
    <TrainerShell title="Messaggi" back={ROUTES.oggi} titleRight={<UrgentBell />}>
      <MessagesView />
    </TrainerShell>
  );
}
