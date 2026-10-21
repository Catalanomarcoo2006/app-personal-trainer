"use client";

import { TrainerShell, ROUTES } from "@/components/prototipo/trainer/Chrome";
import { SettingsView } from "@/components/prototipo/trainer/Settings";

export default function PrototipoImpostazioni() {
  return (
    <TrainerShell title="Impostazioni" back={ROUTES.oggi}>
      <SettingsView />
    </TrainerShell>
  );
}
