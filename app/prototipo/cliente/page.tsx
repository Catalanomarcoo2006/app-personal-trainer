"use client";

import { useState } from "react";
import { Appear } from "@/components/ui/motion";
import { AssistantOrb, AssistantPanel } from "@/components/ui/Assistant";
import { BottomNav, ClientHeader, GoalCard, HabitsRow, NextSession, WeekStrip, WeightCard, WorkoutCard } from "@/components/prototipo/cliente/Sections";
import { assistantAnswers, assistantFallback, assistantSuggestions, trainer } from "@/libs/prototipo/dati-finti";

// App del cliente (telefono). Sul computer si vede dentro una cornice da telefono.
export default function PrototipoCliente() {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="grid min-h-screen place-items-center sm:py-[28px]" style={{ ["--trainer" as string]: trainer.color }}>
      <div className="relative h-[100dvh] w-full overflow-hidden bg-salvia sm:h-[844px] sm:w-[390px] sm:rounded-[48px] sm:border-[10px] sm:border-[#111] sm:shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
        <div className="h-full overflow-y-auto px-[16px] pt-[18px] pb-[96px] [scrollbar-width:none]">
          <Appear i={0}>
            <ClientHeader />
          </Appear>
          <div className="mt-[16px] flex flex-col gap-[10px]">
            <Appear i={1}>
              <WeekStrip />
            </Appear>
            <Appear i={2}>
              <GoalCard />
            </Appear>
            <Appear i={3}>
              <NextSession />
            </Appear>
            <Appear i={4}>
              <WorkoutCard />
            </Appear>
            <Appear i={5}>
              <WeightCard />
            </Appear>
            <Appear i={6}>
              <HabitsRow />
            </Appear>
          </div>
        </div>

        <BottomNav />
        <div className="absolute right-[18px] bottom-[14px] z-30">
          <AssistantOrb onOpen={() => setAssistantOpen(true)} />
        </div>

        <AssistantPanel
          open={assistantOpen}
          onClose={() => setAssistantOpen(false)}
          suggestions={assistantSuggestions}
          answers={assistantAnswers}
          fallback={assistantFallback}
          trainerName={trainer.name.split(" ")[0]}
        />
      </div>
    </div>
  );
}
