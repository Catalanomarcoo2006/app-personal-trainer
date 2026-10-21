"use client";

import { FitCanvas } from "@/components/ui/basics";
import { Appear } from "@/components/ui/motion";
import { Sidebar, SoundPill, TitleRow, TopBar } from "@/components/prototipo/trainer/Chrome";
import { AlertsCard, CalendarCard, MonthCard, PathCards, PathHeader, ProfileCard } from "@/components/prototipo/trainer/Cards";

// Home "Oggi" del trainer. Tela disegnata a 1303 px come il riferimento, adattata alla finestra.
export default function PrototipoTrainer() {
  return (
    <FitCanvas width={1303} minHeight={640}>
      <Appear i={0} className="pt-[11px]">
        <TopBar />
        <TitleRow />
      </Appear>

      <Sidebar />

      <main className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[316px_1fr] gap-x-[14px] pr-[18px] pl-[80px]">
        <div className="flex min-h-0 flex-col gap-[9px]">
          <Appear i={1}>
            <ProfileCard />
          </Appear>
          <Appear i={3} className="min-h-0 flex-1">
            <MonthCard />
          </Appear>
        </div>

        <div className="flex min-h-0 flex-col">
          <Appear i={1}>
            <PathHeader />
          </Appear>
          <PathCards />
          <div className="mt-[9px] grid min-h-0 flex-1 grid-cols-[434px_1fr] gap-[10px]">
            <Appear i={4} className="flex min-h-0 [&>section]:flex-1">
              <CalendarCard />
            </Appear>
            <Appear i={5} className="flex min-h-0 [&>section]:flex-1">
              <AlertsCard />
            </Appear>
          </div>
        </div>
      </main>

      <SoundPill />
    </FitCanvas>
  );
}
