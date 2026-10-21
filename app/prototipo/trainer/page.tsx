"use client";

import { CalendarDays } from "lucide-react";
import { Appear } from "@/components/ui/motion";
import { Pill } from "@/components/ui/basics";
import { TrainerShell } from "@/components/prototipo/trainer/Chrome";
import { ClientsHeader, MessagesCard, PathCards, ProfileCard } from "@/components/prototipo/trainer/Cards";
import { RevenueCard } from "@/components/prototipo/trainer/Revenue";
import { AgendaCard } from "@/components/prototipo/trainer/Agenda";
import { ClientsButton, UrgentBell, UrgentToast } from "@/components/prototipo/trainer/Urgent";
import { trainer } from "@/libs/prototipo/dati-finti";

// Home "Oggi" del trainer.
export default function PrototipoTrainer() {
  return (
    <TrainerShell
      title="La tua giornata"
      titleLeft={<ClientsButton />}
      titleRight={
        <>
          <UrgentBell />
          <Pill className="h-[26px] px-[12px] text-[11px] font-medium">
            {trainer.month} <CalendarDays size={12} strokeWidth={2} />
          </Pill>
        </>
      }
    >
      <UrgentToast />
      <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_1fr] gap-x-[14px] pr-[18px] pl-[80px]">
        <div className="flex min-h-0 flex-col gap-[10px]">
          <Appear i={1}>
            <ProfileCard />
          </Appear>
          <Appear i={3} className="min-h-0 flex-1">
            <RevenueCard />
          </Appear>
        </div>

        <div className="flex min-h-0 flex-col">
          <Appear i={1}>
            <ClientsHeader />
          </Appear>
          <PathCards />
          <div className="mt-[10px] grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-[10px]">
            <Appear i={4} className="flex min-h-0">
              <AgendaCard />
            </Appear>
            <Appear i={5} className="flex min-h-0">
              <MessagesCard />
            </Appear>
          </div>
        </div>
      </main>
    </TrainerShell>
  );
}
