"use client";

// App del cliente: sceglie la sezione dall'indirizzo e la mette nel guscio con il suo titolo.
// Tutte le sezioni sono fatte (28-29/10): Home, Allenamento, Progressi, Messaggi, Profilo con i documenti, e Leo.

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { client } from "@/libs/prototipo/dati-finti";
import { FOTO_CLIENTE, Guscio, Telefono } from "./Shell";
import { Registrazione, useRegistrazione } from "./Registrazione";
import { BellRing, Loader2 } from "lucide-react";
import { LeoCliente, useChatCliente, type ChatCliente } from "./LeoCliente";
import { IngressoLeo } from "./IngressoLeo";
import { FacciaLeo } from "@/components/prototipo/trainer/telefono/TastoLeo";
import { Home, TrainerDiGiulia } from "./Home";
import { Progressi } from "./Progressi";
import { Messaggi, useNonLettiCliente } from "./Messaggi";
import { Allenamento } from "./Allenamento";
import { Profilo } from "./Profilo";
import { ROTTE_CLIENTE, sezioneDa, VOCI_BARRA, type SezioneCliente } from "./nav";

const TITOLI: Record<SezioneCliente, { titolo: string; breve: string }> = {
  home: { titolo: `Ciao, ${client.name}! 👋`, breve: `Ciao, ${client.name}` },
  allenamento: { titolo: "Allenamento", breve: "Allenamento" },
  progressi: { titolo: "Progressi", breve: "Progressi" },
  messaggi: { titolo: "Messaggi", breve: "Messaggi" },
  profilo: { titolo: "Profilo", breve: "Profilo" },
};

export function ClientApp() {
  const sezione = sezioneDa(usePathname());
  const [leo, setLeo] = useState(false);
  const chatLeo = useChatCliente(); // la usano il foglio di Leo e la sua faccia (vocale tenuto premuto)
  const chiudiLeo = useCallback(() => setLeo(false), []);
  const nonLetti = useNonLettiCliente(sezione === "messaggi");
  const t = TITOLI[sezione];
  const [registrata, segnaRegistrata] = useRegistrazione();

  // primo accesso: prima la registrazione (finché il browser non è letto, il telefono vuoto: niente lampi)
  if (registrata === null) return <Telefono>{null}</Telefono>;
  if (!registrata) return <Registrazione onFatta={segnaRegistrata} />;

  return (
    <Guscio
      sezione={sezione}
      voci={VOCI_BARRA.map((v) => ({ chiave: v.sezione, label: v.label, icon: v.icon, href: ROTTE_CLIENTE[v.sezione], badge: v.sezione === "messaggi" ? nonLetti : undefined }))}
      foto={{ src: FOTO_CLIENTE, label: "Il tuo profilo", href: ROTTE_CLIENTE.profilo }}
      titolo={t.titolo}
      titoloBreve={t.breve}
      sotto={sezione === "home" ? <TrainerDiGiulia /> : undefined}
      fuori={
        <>
          {/* in Messaggi c'è la casella in basso: la faccia di Leo starebbe sopra */}
          {!leo && sezione !== "messaggi" && (
            <FacciaLeo
              occupato={chatLeo.risponde}
              quanti={chatLeo.messaggi.length}
              chiedi={(t) => void chatLeo.chiedi(t)}
              mostra={(da, apriChat) => rispostaNelFumetto(chatLeo, da, apriChat)}
              consiglio={
                <>
                  <b>Tocca</b> per scrivere a Leo, <b>tieni premuto</b> per fargli una domanda a voce
                </>
              }
              onApri={() => setLeo(true)}
            />
          )}
          <IngressoLeo />
          <LeoCliente chat={chatLeo} aperto={leo} onChiudi={chiudiLeo} />
        </>
      }
    >
      {sezione === "home" && <Home />}
      {sezione === "allenamento" && (
        <Allenamento />
      )}
      {sezione === "progressi" && (
        <Progressi />
      )}
      {sezione === "messaggi" && <Messaggi />}
      {sezione === "profilo" && <Profilo />}
      {/* spazio per la faccia di Leo: l'ultima riga non resta sotto */}
      {sezione !== "messaggi" && <div aria-hidden className="h-[64px]" />}
    </Guscio>
  );
}

// Il fumetto sopra la faccia di Leo dopo una domanda a voce: la risposta (tocca per aprire la chat) e, con un
// dolore, la riga "Ho avvisato Marco".
function rispostaNelFumetto(chat: ChatCliente, da: number, apriChat: () => void) {
  const dopo = chat.messaggi.slice(da);
  const risposta = dopo.find((m) => m.da === "leo");
  const avviso = dopo.find((m) => m.da === "avviso");
  return {
    resta: chat.risponde || !risposta,
    nodo: (
      <>
        <button type="button" onClick={apriChat} className="mt-[6px] block w-full cursor-pointer text-left">
          {risposta?.testo ? (
            <span className="line-clamp-5 font-medium">{risposta.testo}</span>
          ) : (
            <span className="flex items-center gap-[6px] text-muted">
              <Loader2 size={13} className="animate-spin" /> Leo ci sta pensando…
            </span>
          )}
        </button>
        {avviso && (
          <p className="mt-[8px] flex items-center gap-[6px] text-[12px] font-semibold" style={{ color: "var(--trainer)" }}>
            <BellRing size={13} /> {avviso.testo}
          </p>
        )}
      </>
    ),
  };
}
