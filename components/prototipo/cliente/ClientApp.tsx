"use client";

// App del cliente: sceglie la sezione dall'indirizzo e la mette nel guscio con il suo titolo.
// Fatte (28/10): Home, Allenamento (la scheda intera), Progressi, Messaggi e Leo; il Profilo è il prossimo lavoro.

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { Hammer } from "lucide-react";
import { client } from "@/libs/prototipo/dati-finti";
import { Guscio, Telefono } from "./Shell";
import { Registrazione, useRegistrazione } from "./Registrazione";
import { LeoCliente } from "./LeoCliente";
import { Home, TrainerDiGiulia } from "./Home";
import { Progressi } from "./Progressi";
import { Messaggi, useNonLettiCliente } from "./Messaggi";
import { Allenamento } from "./Allenamento";
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

export function ClientApp() {
  const sezione = sezioneDa(usePathname());
  const [leo, setLeo] = useState(false);
  const chiudiLeo = useCallback(() => setLeo(false), []);
  const nonLetti = useNonLettiCliente(sezione === "messaggi");
  const t = TITOLI[sezione];
  const [registrata, segnaRegistrata] = useRegistrazione();

  // primo accesso: prima la registrazione (finché il browser non è letto, il telefono vuoto: niente lampi)
  if (registrata === null) return <Telefono>{null}</Telefono>;
  if (!registrata) return <Registrazione onFatta={segnaRegistrata} />;

  return (
    <Guscio sezione={sezione} titolo={t.titolo} titoloBreve={t.breve} sotto={sezione === "home" ? <TrainerDiGiulia /> : undefined} nonLetti={nonLetti} fuori={<LeoCliente aperto={leo} onChiudi={chiudiLeo} />}>
      {sezione === "home" && <Home onLeo={() => setLeo(true)} />}
      {sezione === "allenamento" && (
        <Allenamento />
      )}
      {sezione === "progressi" && (
        <Progressi />
      )}
      {sezione === "messaggi" && <Messaggi />}
      {sezione === "profilo" && <InArrivo cosa="Il profilo con i tuoi documenti" />}
    </Guscio>
  );
}
