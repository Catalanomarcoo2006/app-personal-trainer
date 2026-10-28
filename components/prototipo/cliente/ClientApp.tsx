"use client";

// App del cliente: sceglie la sezione dall'indirizzo e la mette nel guscio con il suo titolo.
// Home è fatta (28/10); Allenamento e Progressi usano per ora le schede di prima (Sections.tsx), Messaggi e Profilo
// sono i prossimi lavori.

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Hammer } from "lucide-react";
import { AssistantPanel } from "@/components/ui/Assistant";
import { assistantAnswers, assistantFallback, assistantSuggestions, client, conversations, trainer } from "@/libs/prototipo/dati-finti";
import { Guscio } from "./Shell";
import { CLIENTE_DEMO, Home, TrainerDiGiulia } from "./Home";
import { GoalCard, WeightCard, WorkoutCard } from "./Sections";
import { sezioneDa, type SezioneCliente } from "./nav";

const TITOLI: Record<SezioneCliente, { titolo: string; breve: string }> = {
  home: { titolo: `Ciao, ${client.name}! 👋`, breve: `Ciao, ${client.name}` },
  allenamento: { titolo: "Allenamento", breve: "Allenamento" },
  progressi: { titolo: "Progressi", breve: "Progressi" },
  messaggi: { titolo: "Messaggi", breve: "Messaggi" },
  profilo: { titolo: "Profilo", breve: "Profilo" },
};

function InArrivo({ cosa }: { cosa: string }) {
  return (
    <div className="panel mt-[18px] flex flex-col items-center rounded-[24px] px-[20px] py-[34px] text-center">
      <span className="sel-trainer grid size-[48px] place-items-center rounded-full" style={{ color: "var(--trainer)" }}>
        <Hammer size={20} />
      </span>
      <p className="mt-[12px] text-[15px] font-bold">{cosa} in arrivo</p>
      <p className="mt-[5px] text-[12.5px] text-muted">È il prossimo pezzo dell&apos;app del cliente.</p>
    </div>
  );
}

const Colonna = ({ children }: { children: ReactNode }) => <div className="mt-[16px] flex flex-col gap-[10px]">{children}</div>;

export function ClientApp() {
  const sezione = sezioneDa(usePathname());
  const [leo, setLeo] = useState(false);
  const nonLetti = conversations.find((c) => c.clientId === CLIENTE_DEMO)?.unread ?? 0;
  const t = TITOLI[sezione];

  return (
    <Guscio sezione={sezione} titolo={t.titolo} titoloBreve={t.breve} sotto={sezione === "home" ? <TrainerDiGiulia /> : undefined} nonLetti={nonLetti}>
      {sezione === "home" && <Home onLeo={() => setLeo(true)} />}
      {sezione === "allenamento" && (
        <Colonna>
          <WorkoutCard />
        </Colonna>
      )}
      {sezione === "progressi" && (
        <Colonna>
          <GoalCard />
          <WeightCard />
        </Colonna>
      )}
      {sezione === "messaggi" && <InArrivo cosa="La chat con Marco" />}
      {sezione === "profilo" && <InArrivo cosa="Il profilo con i tuoi documenti" />}
      <AssistantPanel open={leo} onClose={() => setLeo(false)} suggestions={assistantSuggestions} answers={assistantAnswers} fallback={assistantFallback} trainerName={trainer.name.split(" ")[0]} />
    </Guscio>
  );
}
