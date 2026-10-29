"use client";

// App del cliente: sceglie la sezione dall'indirizzo e la mette nel guscio con il suo titolo.
// Tutte le sezioni sono fatte (28-29/10): Home, Allenamento, Progressi, Messaggi, Profilo con i documenti, e Leo.

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { client } from "@/libs/prototipo/dati-finti";
import { FOTO_CLIENTE, Guscio, Telefono } from "./Shell";
import { Registrazione, useRegistrazione } from "./Registrazione";
import { LeoCliente } from "./LeoCliente";
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
      fuori={<LeoCliente aperto={leo} onChiudi={chiudiLeo} />}
    >
      {sezione === "home" && <Home onLeo={() => setLeo(true)} />}
      {sezione === "allenamento" && (
        <Allenamento />
      )}
      {sezione === "progressi" && (
        <Progressi />
      )}
      {sezione === "messaggi" && <Messaggi />}
      {sezione === "profilo" && <Profilo />}
    </Guscio>
  );
}
