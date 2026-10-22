"use client";

import { Fragment, ReactNode, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Appear } from "@/components/ui/motion";
import { Pill } from "@/components/ui/basics";
import { clientById, trainer } from "@/libs/prototipo/dati-finti";
import { TrainerShell } from "./Chrome";
import { BASE, ROUTES } from "./nav";
import { ClientsHeader, MessagesCard, PathCards, ProfileCard } from "./Cards";
import { RevenueCard } from "./Revenue";
import { AgendaCard } from "./Agenda";
import { ClientsButton, UrgentBell } from "./Urgent";
import { ClientList } from "./ClientList";
import { ClientNotFound, ClientProfile } from "./ClientProfile";
import { MessagesView } from "./Messages";
import { PlansView } from "./Plans";
import { WeekCalendar } from "./WeekCalendar";
import { PaymentsView } from "./Payments";
import { SettingsView } from "./Settings";

// Sceglie la sezione dall'indirizzo. Gli indirizzi restano quelli di sempre (/prototipo/trainer/clienti, ...),
// ma il cambio avviene nel browser: niente richiesta al server, niente attesa.
export function TrainerApp() {
  const path = usePathname();
  const [section, id] = path.slice(BASE.length).split("/").filter(Boolean);

  switch (section) {
    case "clienti": {
      if (id) {
        const c = clientById(id);
        return (
          <TrainerShell title={c ? c.name : "Cliente"} back={ROUTES.clienti} titleRight={<UrgentBell />}>
            {c ? <ClientProfile key={c.id} c={c} /> : <ClientNotFound />}
          </TrainerShell>
        );
      }
      return (
        <TrainerShell title="I tuoi clienti" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <Suspense>
            <ByQuery>
              <ClientList />
            </ByQuery>
          </Suspense>
        </TrainerShell>
      );
    }
    case "messaggi":
      return (
        <TrainerShell title="Messaggi" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <Suspense>
            <ByQuery>
              <MessagesView />
            </ByQuery>
          </Suspense>
        </TrainerShell>
      );
    case "schede":
      return (
        <TrainerShell title="Schede di allenamento" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <Suspense>
            <ByQuery>
              <PlansView />
            </ByQuery>
          </Suspense>
        </TrainerShell>
      );
    case "calendario":
      return (
        <TrainerShell title="Calendario" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <WeekCalendar />
        </TrainerShell>
      );
    case "incassi":
      return (
        <TrainerShell title="Incassi" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <PaymentsView />
        </TrainerShell>
      );
    case "impostazioni":
      return (
        <TrainerShell title="Impostazioni" back={ROUTES.oggi}>
          <SettingsView />
        </TrainerShell>
      );
    default:
      return <Home />;
  }
}

// Le sezioni leggono i parametri (?cliente=, ?filtro=) all'apertura: se cambiano restando nella stessa
// sezione (per esempio da un avviso), la sezione riparte con quelli nuovi.
function ByQuery({ children }: { children: ReactNode }) {
  return <Fragment key={useSearchParams().toString()}>{children}</Fragment>;
}

// Home "Oggi" del trainer.
function Home() {
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
