"use client";

import { Fragment, memo, ReactNode, Suspense, useEffect, useState } from "react";
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
import { ClientList as ClientListView } from "./ClientList";
import { ClientNotFound, ClientProfile } from "./ClientProfile";
import { MessagesView as MessagesSection } from "./Messages";
import { PlansView as PlansSection } from "./Plans";
import { WeekCalendar } from "./WeekCalendar";
import { PaymentsView } from "./Payments";
import { SettingsView } from "./Settings";

// Le sezioni che leggono l'indirizzo ricevono i parametri come testo: con memo si ridisegnano solo se cambiano davvero.
const ClientList = memo(ClientListView);
const MessagesView = memo(MessagesSection);
const PlansView = memo(PlansSection);

// Quante sezioni già aperte restano pronte in memoria (le più recenti).
const KEEP = 10;

// Sceglie la sezione dall'indirizzo. Gli indirizzi restano quelli di sempre (/prototipo/trainer/clienti, ...),
// ma il cambio avviene nel browser: niente richiesta al server, niente attesa.
// Le sezioni già visitate restano montate e nascoste: tornarci è istantaneo e ritrovi tutto come l'avevi lasciato.
// Tranne la home: lasciandola si smonta, così tornandoci si ricostruisce e ripartono tutte le animazioni
// (schede che entrano, numeri che contano, colonne del grafico che crescono).
export function TrainerApp() {
  const path = usePathname();
  const [kept, setKept] = useState<string[]>([path]);
  const list = kept.includes(path) ? kept : [...kept.slice(-(KEEP - 1)), path];

  useEffect(() => {
    if (list !== kept) setKept(list);
  }, [list, kept]);

  return (
    <>
      {list.map((p) =>
        p === BASE && p !== path ? null : (
          <div key={p} data-sezione={p} className={p === path ? "section-live" : "hidden"}>
            <Section path={p} />
          </div>
        ),
      )}
    </>
  );
}

// memo: cambiando indirizzo si ridisegna solo la sezione che compare, non quelle nascoste.
const Section = memo(function Section({ path }: { path: string }) {
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
            <ByQuery>{(q) => <ClientList search={q} />}</ByQuery>
          </Suspense>
        </TrainerShell>
      );
    }
    case "messaggi":
      return (
        <TrainerShell title="Messaggi" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <Suspense>
            <ByQuery>{(q) => <MessagesView search={q} />}</ByQuery>
          </Suspense>
        </TrainerShell>
      );
    case "schede":
      return (
        <TrainerShell title="Schede di allenamento" back={ROUTES.oggi} titleRight={<UrgentBell />}>
          <Suspense>
            <ByQuery>{(q) => <PlansView search={q} />}</ByQuery>
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
});

// Le sezioni leggono i parametri (?cliente=, ?filtro=) all'apertura: se cambiano restando nella stessa
// sezione (per esempio da un avviso), la sezione riparte con quelli nuovi.
function ByQuery({ children }: { children: (query: string) => ReactNode }) {
  const query = useSearchParams().toString();
  return <Fragment key={query}>{children(query)}</Fragment>;
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
