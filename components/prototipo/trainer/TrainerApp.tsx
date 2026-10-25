"use client";

import { Fragment, memo, ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Appear } from "@/components/ui/motion";
import { Pill } from "@/components/ui/basics";
import { suonoConteggio } from "@/libs/ui/sound";
import { ingressoConMeteoriti, meteoritiFatti } from "@/libs/prototipo/ingresso";
import { trainer } from "@/libs/prototipo/dati-finti";
import { useCliente } from "@/libs/dati/selettori";
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
import { Meteora } from "./Meteora";
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

// Il profilo legge il cliente dallo store: segue le modifiche di Leo e dei tasti (pagamenti, misure, note).
function ClienteSection({ id }: { id: string }) {
  const c = useCliente(id);
  return (
    <TrainerShell title={c ? c.name : "Cliente"} back={ROUTES.clienti} titleRight={<UrgentBell />}>
      {c ? <ClientProfile key={c.id} c={c} /> : <ClientNotFound />}
    </TrainerShell>
  );
}

// memo: cambiando indirizzo si ridisegna solo la sezione che compare, non quelle nascoste.
const Section = memo(function Section({ path }: { path: string }) {
  const [section, id] = path.slice(BASE.length).split("/").filter(Boolean);

  switch (section) {
    case "clienti": {
      if (id) {
        return <ClienteSection id={id} />;
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

// Home "Oggi" del trainer. All'arrivo dal benvenuto le schede principali cadono una alla volta come meteoriti
// (Meteora): incassi, clienti, agenda, messaggi; a ogni impatto la pagina sobbalza appena.
const METEORITI = { inizio: 0.5, passo: 0.42 };

function Home() {
  const [meteoriti] = useState(ingressoConMeteoriti);
  const pagina = useRef<HTMLElement>(null);
  const impatto = (ultimo: boolean) => {
    pagina.current?.animate(
      [{ transform: "translate(0, 0)" }, { transform: "translate(1.5px, 4px)" }, { transform: "translate(-1px, -1.5px)" }, { transform: "translate(0, 0)" }],
      { duration: 260, easing: "ease-out" },
    );
    if (ultimo) meteoritiFatti();
  };
  // Con i meteoriti ogni scheda si monta quando cade: un posto vuoto della stessa misura finché non arriva.
  const cade = (n: number, children: ReactNode, className: string, inclina: number, tono: number) =>
    meteoriti ? (
      <Meteora ritardo={METEORITI.inizio + n * METEORITI.passo} inclina={inclina} tono={tono} onAtterra={() => impatto(n === 3)} className={className}>
        {children}
      </Meteora>
    ) : null;

  // Numeri che salgono (incassi, percentuali dei clienti, colonne del grafico): un solo ticchettio che parte
  // con il primo numero e si ferma con l'ultimo. Muto con "riduci movimento" (i numeri non contano).
  const suonato = useRef(false); // in sviluppo React esegue gli effetti due volte: il suono parte una volta sola
  useEffect(() => {
    // con i meteoriti i numeri contano a ogni atterraggio: suonano gli impatti, non il ticchettio
    if (suonato.current || meteoriti || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    suonato.current = true;
    suonoConteggio({ ritardo: 0.27, durata: 1.25, scatti: 26 });
  }, []);

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
      <main ref={pagina} className="absolute inset-x-0 top-[90px] bottom-[10px] grid grid-cols-[372px_1fr] gap-x-[14px] pr-[18px] pl-[80px]">
        <div className="flex min-h-0 flex-col gap-[10px]">
          <Appear i={1}>
            <ProfileCard />
          </Appear>
          {cade(0, <RevenueCard />, "min-h-0 flex-1", -6, 1) ?? (
            <Appear i={3} className="min-h-0 flex-1">
              <RevenueCard />
            </Appear>
          )}
        </div>

        <div className="flex min-h-0 flex-col">
          <Appear i={1}>
            <ClientsHeader />
          </Appear>
          {cade(1, <PathCards />, "min-h-[132px]", 4, 1.12) ?? <PathCards />}
          <div className="mt-[10px] grid min-h-0 flex-1 grid-cols-[1.25fr_1fr] gap-[10px]">
            {cade(2, <AgendaCard />, "min-h-0", -5, 0.92) ?? (
              <Appear i={4} className="flex min-h-0">
                <AgendaCard />
              </Appear>
            )}
            {cade(3, <MessagesCard />, "min-h-0", 6, 0.84) ?? (
              <Appear i={5} className="flex min-h-0">
                <MessagesCard />
              </Appear>
            )}
          </div>
        </div>
      </main>
    </TrainerShell>
  );
}
