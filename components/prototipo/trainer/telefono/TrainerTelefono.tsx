"use client";

// Area trainer da telefono (Marco, 29/10): stesso guscio dell'app del cliente, con le voci Oggi · Clienti ·
// Messaggi · Calendario e Leo completo. Incassi e Schede restano sul computer: i loro indirizzi qui portano a Oggi.
// Gli indirizzi sono gli stessi del computer (/prototipo/trainer/...), così i link, le azioni di Leo e gli avvisi
// portano nello stesso posto su tutte e due.

import { ReactNode, useCallback, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays, House, Laptop, MessageCircle, Users } from "lucide-react";
import { playSound } from "@/libs/ui/sound";
import { trainer } from "@/libs/prototipo/dati-finti";
import { seduteDelGiorno } from "@/libs/prototipo/calendario";
import { ADESSO } from "@/libs/prototipo/leo-azioni";
import { useStato, useTrainerPhoto } from "@/libs/prototipo/stato";
import { useCliente } from "@/libs/dati/selettori";
import { conta } from "@/libs/ui/testo";
import { Guscio, type VoceBarra } from "@/components/prototipo/cliente/Shell";
import { Foglio } from "@/components/prototipo/cliente/Foglio";
import { BASE, ROUTES } from "../nav";
import { useCoachChat } from "../leo/useChatLeo";
import { OggiTelefono } from "./Oggi";
import { ClienteNonTrovato, ClientiTelefono, ProfiloTelefono } from "./Clienti";
import { ChatCliente, ElencoMessaggi } from "./Messaggi";
import { CalendarioTelefono, giornoLungo, NuovaSeduta } from "./Calendario";
import { LeoTelefono, TastoLeo } from "./LeoTelefono";
import { useNonLetti } from "./nonLetti";
import { passaA } from "./forma";

type Sezione = "oggi" | "clienti" | "messaggi" | "calendario";

const primo = trainer.name.split(" ")[0];

function leggi(path: string): { sezione: Sezione; id?: string } {
  const [parte, id] = path.slice(BASE.length).split("/").filter(Boolean);
  if (parte === "clienti") return { sezione: "clienti", id };
  if (parte === "messaggi" || parte === "calendario") return { sezione: parte };
  return { sezione: "oggi" }; // anche incassi, schede e impostazioni: da telefono non ci sono
}

// Il foglio dell'account (dalla foto in alto): chi sei e il passaggio alla versione da computer.
function Account({ aperto, onChiudi }: { aperto: boolean; onChiudi: () => void }) {
  const foto = useTrainerPhoto();
  return (
    <Foglio aperto={aperto} onChiudi={onChiudi} titolo="Il tuo account">
      <div className="mt-[14px] flex items-center gap-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt="" className="size-[56px] rounded-full object-cover" />
        <div className="leading-tight">
          <p className="text-[17px] font-extrabold">{trainer.name}</p>
          <p className="mt-[2px] text-[13px] text-muted">{trainer.role}</p>
        </div>
      </div>
      <p className="mt-[16px] text-[13.5px] leading-snug text-muted">Da telefono hai Oggi, Clienti, Messaggi, Calendario e Leo. Incassi, schede e impostazioni li trovi sulla versione da computer.</p>
      <button
        type="button"
        onClick={() => {
          playSound("tap");
          passaA("computer");
        }}
        className="glass mt-[16px] mb-[4px] flex h-[48px] w-full cursor-pointer items-center justify-center gap-[8px] rounded-full text-[14.5px] font-semibold"
      >
        <Laptop size={18} /> Passa alla versione da computer
      </button>
    </Foglio>
  );
}

export function TrainerTelefono() {
  const path = usePathname();
  const query = useSearchParams();
  const { sezione, id } = leggi(path);
  const conCliente = sezione === "messaggi" ? query.get("cliente") : null;
  const cliente = useCliente(id ?? conCliente ?? "");
  const foto = useTrainerPhoto();
  const nonLetti = useNonLetti();
  const totaleNonLetti = Object.values(nonLetti).reduce((a, b) => a + b, 0);
  const seduteOggi = seduteDelGiorno(
    useStato((s) => s.sedute),
    ADESSO.data,
  ).length;

  const chat = useCoachChat({ senzaSoldi: true });
  const [leo, setLeo] = useState(false);
  const apriLeo = useCallback(() => setLeo(true), []);
  const chiudiLeo = useCallback(() => setLeo(false), []);
  const [account, setAccount] = useState(false);
  const [nuova, setNuova] = useState<{ clientId?: string; date?: string } | null>(null);
  const chiudiNuova = useCallback(() => setNuova(null), []);

  const voci: VoceBarra[] = useMemo(
    () => [
      { chiave: "oggi", label: "Oggi", icon: House, href: ROUTES.oggi },
      { chiave: "clienti", label: "Clienti", icon: Users, href: ROUTES.clienti },
      { chiave: "messaggi", label: "Messaggi", icon: MessageCircle, href: ROUTES.messaggi, badge: totaleNonLetti },
      { chiave: "calendario", label: "Calendario", icon: CalendarDays, href: ROUTES.calendario },
    ],
    [totaleNonLetti],
  );

  // titolo, sottopagina e contenuto della sezione
  let titolo: string;
  let breve: string;
  let indietro: { label: string; href: string } | undefined;
  let sotto: ReactNode;
  let contenuto: ReactNode;
  if (sezione === "clienti" && id) {
    titolo = breve = cliente?.name ?? "Cliente";
    indietro = { label: "Clienti", href: ROUTES.clienti };
    sotto = cliente && <p className="mt-[2px] text-[13px] text-muted">{cliente.since.replace(/^Dal/, "Cliente dal")} · {cliente.plan}</p>;
    contenuto = cliente ? <ProfiloTelefono key={cliente.id} c={cliente} onNuovaSeduta={(clientId) => setNuova({ clientId })} /> : <ClienteNonTrovato />;
  } else if (sezione === "clienti") {
    titolo = breve = "Clienti";
    contenuto = <ClientiTelefono />;
  } else if (sezione === "messaggi" && conCliente) {
    titolo = breve = cliente?.name ?? "Messaggi";
    indietro = { label: "Messaggi", href: ROUTES.messaggi };
    contenuto = <ChatCliente key={conCliente} id={conCliente} />;
  } else if (sezione === "messaggi") {
    titolo = breve = "Messaggi";
    sotto = <p className="mt-[2px] text-[13px] text-muted">{totaleNonLetti ? conta(totaleNonLetti, "messaggio da leggere", "messaggi da leggere") : "Tutto letto"}</p>;
    contenuto = <ElencoMessaggi />;
  } else if (sezione === "calendario") {
    titolo = breve = "Calendario";
    contenuto = <CalendarioTelefono giorno={query.get("giorno") ?? undefined} onNuova={({ date }) => setNuova({ date })} />;
  } else {
    titolo = `Ciao, ${primo}! 👋`;
    breve = "Oggi";
    sotto = (
      <p className="mt-[2px] text-[13.5px] text-muted">
        {giornoLungo(ADESSO.data)} · {seduteOggi ? conta(seduteOggi, "seduta", "sedute") : "nessuna seduta"}
      </p>
    );
    contenuto = <OggiTelefono onLeo={apriLeo} />;
  }

  const chiave = path + (conCliente ? `?${conCliente}` : "");

  return (
    <Guscio
      sezione={chiave}
      voci={voci}
      attiva={sezione}
      foto={{ src: foto, label: "Il tuo account", onTocca: () => setAccount(true) }}
      titolo={titolo}
      titoloBreve={breve}
      sotto={sotto}
      indietro={indietro}
      fuori={
        <>
          {!conCliente && !leo && <TastoLeo onApri={apriLeo} />}
          <NuovaSeduta aperta={!!nuova} clientId={nuova?.clientId} date={nuova?.date} onChiudi={chiudiNuova} />
          <Account aperto={account} onChiudi={() => setAccount(false)} />
          <LeoTelefono chat={chat} aperto={leo} onChiudi={chiudiLeo} />
        </>
      }
    >
      {/* data-sezione e section-live: il viaggio di Leo (navigateFade) aspetta che la sezione nuova sia qui */}
      <div data-sezione={path} className="section-live sezione-telefono">
        {contenuto}
        {/* spazio per il tasto di Leo: l'ultima riga non resta sotto */}
        {!conCliente && <div aria-hidden className="h-[56px]" />}
      </div>
    </Guscio>
  );
}
